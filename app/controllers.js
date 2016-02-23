var app = angular.module('boarding');
app.controller('loginCtrl', ['$scope', '$rootScope', '$service', '$location', 'md5', function ($scope, $rootScope, $service, $location, md5) {
    $scope.$parent.privileges = null;
    $scope.userid = '';
    $scope.pw = '';
    $scope.alerts = [];
    $scope.login = function () {
        $scope.alerts = [];
        if (!$scope.userid || !$scope.pw) {
            $scope.alerts.push({ error: "Please enter your user name or password" });
            return;
        }
        var info = {
            userid: $scope.userid,
            pw: md5.createHash($scope.pw)
        };
        $service.login(
            info,
            function (data) {
                getPrivileges();
            },
            function (data) {
                $scope.alerts.push(data);
            });
    };
    var getPrivileges = function () {
        $service.getPrivileges(
            { user: $scope.userid },
            function (data) {
                $scope.$parent.privileges = data;
                $scope.$parent.privileges.userid = $scope.userid;
                $location.path("home");
            },
            function (data) {
                $scope.alerts.push(data);
            });
    };
    $scope.clear = function () {
        $scope.alerts = [];
        $scope.userid = '';
        $scope.pw = '';
    };
    $rootScope.listener = function (data) { };
}]);

app.controller('homeCtrl', ['$scope', '$rootScope', '$service', '$location', function ($scope, $rootScope, $service, $location) {
    if (!$scope.$parent.privileges) {
        $location.path("login");
        return;
    }

    var now = new Date();
    var today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    var tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    $scope.clear = function () {
        $scope.info = {
            ticketNumber: '',
            couponNumber: '',
            pnr: '',
            firstName: '',
            lastName: '',
        };
        $scope.selectedBoardingPoint = $scope.$parent.privileges.boardingPoints[0].iatacd;
        $scope.fromDate = new Date(today);
        $scope.toDate = new Date(tomorrow);
        $scope.coupons = null;
        $scope.selectedCoupon = null;
        $scope.alerts = [];
        $scope.currentPage = 1;
    };
    $scope.clear();
    var dayBegin = function (date) {
        var yyyy = date.getFullYear().toString();
        var mm = (date.getMonth() + 1).toString(); // getMonth() is zero-based
        var dd = date.getDate().toString();
        return yyyy + '-' + (mm[1] ? mm : '0' + mm[0]) + '-' + (dd[1] ? dd : '0' + dd[0]) + 'T00:00:00Z'; // padding
    };
    var dayEnd = function (date) {
        var yyyy = date.getFullYear().toString();
        var mm = (date.getMonth() + 1).toString(); // getMonth() is zero-based
        var dd = date.getDate().toString();
        return yyyy + '-' + (mm[1] ? mm : '0' + mm[0]) + '-' + (dd[1] ? dd : '0' + dd[0]) + 'T23:59:59Z'; // padding
    };
    $scope.search = function (scanned) {
        $scope.coupons = null;
        $scope.selectedCoupon = null;
        $scope.alerts = [];
        $scope.currentPage = 1;
        var info = {
            user: $scope.$parent.privileges.userid,
            ticketNumber: $scope.info.ticketNumber ? $scope.info.ticketNumber : null,
            couponNumber: $scope.info.couponNumber ? $scope.info.couponNumber : null,
            pnr: $scope.info.pnr ? $scope.info.pnr : null,
            firstName: $scope.info.firstName ? $scope.info.firstName : null,
            lastName: $scope.info.lastName ? $scope.info.lastName : null,
            boardingPoint: $scope.selectedBoardingPoint,
            travelDateFrom: dayBegin(new Date($scope.fromDate)),
            travelDateTo: dayEnd(new Date($scope.toDate))
        };
        $scope.searching = true;
        $service.search(
            info,
            function (data) {
                $scope.searching = false;
                $scope.coupons = data.coupons;
                if ($scope.coupons.length == 1) {
                    $scope.select($scope.coupons[0]);
                    // auto boarding
                    if (scanned && $scope.$parent.privileges.role.toUpperCase() == 'RAILWAY'
                        && ($scope.selectedCoupon.couponStatus == 'AL' || $scope.selectedCoupon.couponStatus == 'CK')) {
                        $scope.changeStatus($scope.coupons[0]);
                    }
                }
            },
            function (data) {
                $scope.searching = false;
                $scope.alerts.push(data);
            });
    };
    $scope.predicate = 'departure';
    $scope.reverse = false;
    $scope.order = function (predicate) {
        $scope.reverse = ($scope.predicate === predicate) ? !$scope.reverse : false;
        $scope.predicate = predicate;
    };
    $scope.orderClass = function () {
        if ($scope.reverse) {
            return 'glyphicon glyphicon-sort-by-attributes-alt';
        } else {
            return 'glyphicon glyphicon-sort-by-attributes';
        }
    };
    $scope.toLocalDate = function (utc) {
        if (!utc) return;
        var date = new Date(utc);
        var local = new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds());
        return local;
    };
    $scope.betweenDate = function (coupon) {
        if (!$scope.toDate && !$scope.fromDate) {
            return true;
        }
        var departure = $scope.toLocalDate(new Date(coupon.departure));
        if (!$scope.toDate) {
            return departure >= $scope.fromDate;
        }
        var afterToDate = new Date($scope.toDate);
        afterToDate.setDate(afterToDate.getDate() + 1);
        if (!$scope.fromDate) {
            return departure < afterToDate;
        }
        return departure >= $scope.fromDate && departure < afterToDate;
    };
    $scope.select = function (coupon) {
        $scope.selectedCoupon = coupon;
        $scope.index = $scope.coupons.indexOf(coupon);
    };
    $scope.changeStatus = function (coupon) {
        $scope.alerts = [];
        var action = null;
        if ($scope.$parent.privileges && $scope.$parent.privileges.role.toUpperCase() == 'RAILWAY') {
            if (coupon.couponStatus == 'AL' || coupon.couponStatus == 'CK') {
                action = 'board';
            } else if (coupon.couponStatus == 'BD') {
                action = 'unboard';
            } else {
                return;
            }
        } else if ($scope.$parent.privileges && $scope.$parent.privileges.role.toUpperCase() == 'AIRLINE') {
            if (coupon.couponStatus == 'CK') {
                action = 'undo-checkin';
            } else {
                return;
            }
        }
        var previousStatus = coupon.couponStatus;

        coupon.statusMessage = 'Status Change in Progress';
        $service.changeStatus(
            action,
            {
                user: $scope.$parent.privileges.userid,
                ticketNumber: coupon.ticketNumber,
                couponNumber: coupon.couponNumber,
                boardingPoint: $scope.selectedBoardingPoint
            },
            function (data) {
                data.coupons[0].previousStatus = previousStatus;
                data.coupons[0].statusMessage = 'Status Changed';
                $scope.coupons[$scope.index] = data.coupons[0];
                $scope.selectedCoupon = data.coupons[0];
            },
            function (data) {
                coupon.statusMessage = 'Status Change Failed'
                $scope.alerts.push(data);
            });
    };
    $scope.rowStyle = function (coupon) {
        if (!coupon) return '';
        var result = '';
        if (coupon.statusMessage == 'Status Changed') {
            result = 'success';
        } else if (coupon.statusMessage == 'Status Change in Progress') {
            result = 'warning';
        } else if (coupon.statusMessage == 'Status Change Failed') {
            result = 'danger';
        }
        if ($scope.selectedCoupon == coupon) {
            result += ' text-bold';
        }
        return result
    };
    $scope.formatStatus = function (statusCode) {
        var status = statusCode;
        switch (statusCode) {
            case 'AL':
                status = 'Airport Control';
                break;
            case 'CK':
                status = 'Checked In';
                break;
            case 'BD':
                status = 'Boarded';
                break;
            case 'B':
                status = 'Flown';
                break;
            case 'V':
                status = 'Voided';
                break;
            case 'RF':
                status = 'Refunded';
                break;
            case 'E':
                status = 'Exchanged';
                break;
            case 'NAV':
                status = 'Not available';
                break;
            case 'I':
                status = 'Original issue';
                break;
            default:
        }
        return status;
    }
    $scope.action = function (coupon) {
        if (!coupon) return;
        if ($scope.$parent.privileges && $scope.$parent.privileges.role.toUpperCase() == 'RAILWAY') {
            if (coupon.couponStatus == 'AL' || coupon.couponStatus == 'CK') {
                return 'Board';
            } else if (coupon.couponStatus == 'BD') {
                return 'OffBoard';
            } else {
                return '';
            }
        } else if ($scope.$parent.privileges && $scope.$parent.privileges.role.toUpperCase() == 'AIRLINE') {
            if (coupon.couponStatus == 'CK') {
                return 'Unchecked In';
            } else {
                return '';
            }
        }
    };
    $scope.actionClass = function (coupon) {
        if (!coupon) return;
        if ($scope.$parent.privileges && $scope.$parent.privileges.role.toUpperCase() == 'RAILWAY') {
            if (coupon.couponStatus == 'AL' || coupon.couponStatus == 'CK') {
                return 'btn-success';
            } else if (coupon.couponStatus == 'BD') {
                return 'btn-warning';
            } else {
                return '';
            }
        } else if ($scope.$parent.privileges && $scope.$parent.privileges.role.toUpperCase() == 'AIRLINE') {
            if (coupon.couponStatus == 'CK') {
                return 'btn-warning';
            } else {
                return '';
            }
        }
    };
    $scope.ticketNumberChange = function () {
        var i;
        var result = '';
        for (i = 0; i < $scope.info.ticketNumber.length; i++) {
            if ($scope.info.ticketNumber.charAt(i) >= '0' && $scope.info.ticketNumber.charAt(i) <= '9') {
                result += $scope.info.ticketNumber.charAt(i);
            }
        }
        $scope.info.ticketNumber = result.substring(0, 13);
    };
    $scope.couponNumberChange = function () {
        if (!$scope.info.couponNumber) return;
        var c = $scope.info.couponNumber.charAt($scope.info.couponNumber.length - 1);
        if (c >= '1' && c <= '4') {
            $scope.info.couponNumber = c;
        } else {
            $scope.info.couponNumber = '';
        }
    };
    $scope.minDate = new Date();
    $scope.maxDate = new Date();
    $scope.maxDate = $scope.maxDate.setDate($scope.maxDate.getDate() + 30);
    $scope.popup1 = {
        opened: false
    };
    $scope.popup2 = {
        opened: false
    };
    $scope.open1 = function () {
        $scope.popup1.opened = true;
    };
    $scope.open2 = function () {
        $scope.popup2.opened = true;
    };
    $scope.fromDateChange = function () {
        if ($scope.toDate && $scope.fromDate && $scope.toDate < $scope.fromDate) {
            $scope.toDate = $scope.fromDate;
        }
    };
    $rootScope.listener = function (data) {
        if (data.indexOf('<<<') > -1) {
            var firstEnd = data.indexOf('<<');
            var lastEnd = data.indexOf('<<<');
            $scope.info.ticketNumber = '';
            $scope.info.couponNumber = '';
            $scope.info.pnr = '';

            $scope.info.lastName = data.substring(5, firstEnd).replace('<', ' ');
            $scope.info.firstName = data.substring(firstEnd + 2, lastEnd).replace('<', ' ');
        } else if (data.length == 15 && data.indexOf('/') == 13) {
            $scope.info.ticketNumber = data.substring(0, 13);
            $scope.info.couponNumber = data.substring(14);
            $scope.info.pnr = '';

            $scope.info.firstName = '';
            $scope.info.lastName = '';
        } else {
            return;
        }
        $scope.$apply();
        $scope.search(true);
    };
}]);
