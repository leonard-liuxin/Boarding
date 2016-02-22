var app = angular.module('boarding', [
    'ngRoute',
    'angular-md5',
    'gettext',
    'ui.bootstrap',
    'ngWebsocket',
    'services'
]);
app.run(['$rootScope', '$websocket', function($rootScope, $websocket){
	var ws = $websocket.$new('ws://localhost:12345');
	ws.$on('$message', function (data) {
		$rootScope.listener(data);
	});
}]);
app.config(['$routeProvider',
    function($routeProvider) {
        $routeProvider.
        when('/', {
            templateUrl: 'login.html',
            controller: 'loginCtrl'
        }).
        when('/home', {
            templateUrl: 'home.html',
            controller: 'homeCtrl'
        }).
        otherwise({
            redirectTo: '/'
        });
    }
]);
app.controller('appCtrl', ['$scope', '$location', '$window', 'gettextCatalog', function($scope, $location, $window, gettextCatalog) {
    if($window.sessionStorage["cslang"]) {
        $scope.currentLanguage = JSON.parse($window.sessionStorage["cslang"]);
    } else {
        $scope.currentLanguage = 'English';
    }
    $scope.languages = ['English', '日本語'];
    $scope.userName = function() {
        if(!$scope.privileges) {
            return 'Not signed in';
        } else {
            return $scope.privileges.name;
        }
    }
    $scope.logout = function() {
        $location.path("login");
        $scope.privileges = null;
    }
    $scope.changeLanguage = function(language) {
        $scope.currentLanguage = language;
        if (language === 'English') {
            gettextCatalog.setCurrentLanguage('en');
        } else if (language === '日本語') {
            gettextCatalog.setCurrentLanguage('ja');
        }
        $window.sessionStorage["cslang"] = JSON.stringify(language);
    }
    $scope.changeLanguage($scope.currentLanguage);
}]);
