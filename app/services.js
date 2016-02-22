'use strict';

/* Services */

var services = angular.module('services', []);
services.
value('version', '0.1');

services.
// Production:
// value('serviceUrl', 'https://publicwsj.acprailinternational.com/ws/');

// Test:
// value('serviceUrl', 'http://testbooking.acprail.com:1080/jsonlh/');
value('serviceUrl', 'http://10.0.0.6:8103/jsonlh/');

services.factory('$service', ['$http', 'serviceUrl', 'md5', function($http, serviceUrl, md5) {
    return {
        login: function (info, callback, errCallback) {
            $http({method: 'POST', cache: false , url: serviceUrl + 'authenticate', data: info, withCredentials: true}).success(function(data) {
                if (data && !data.error) {
                    callback(data);
                } else {
                    errCallback(data);
                }
            }).
            error(function(data, status, headers, config) {
                errCallback({error: 'Connection Error'});
            });
        },
        getPrivileges: function (info, callback, errCallback) {
            $http({method: 'POST', cache: false , url: serviceUrl + 'boarding/get-privileges', data: info, withCredentials: true}).success(function(data) {
                if (data && !data.error) {
                    callback(data);
                } else {
                    errCallback(data);
                }
            }).
            error(function(data, status, headers, config) {
                errCallback({error: 'Connection Error'});
            });
        },
        search: function (info, callback, errCallback) {
            $http({method: 'POST', cache: false , url: serviceUrl + 'boarding/search', data: info, withCredentials: true}).success(function(data) {
                if (data && !data.error) {
                    callback(data);
                } else {
                    errCallback(data);
                }
            }).
            error(function(data, status, headers, config) {
                errCallback({error: 'Connection Error'});
            });
        },
        changeStatus: function (action, info, callback, errCallback) {
            $http({method: 'POST', cache: false , url: serviceUrl + 'boarding/' + action, data: info, withCredentials: true}).success(function(data) {
                if (data && !data.error) {
                    callback(data);
                } else {
                    errCallback(data);
                }
            }).
            error(function(data, status, headers, config) {
                errCallback({error: 'Connection Error'});
            });
        },
    };
}]);
