'use strict';

angular.module('starter.services', []).service('GetINFOService', function ($q, $http, $localStorage) {
    if ($localStorage.information) {
        var auth_header = $localStorage.information.reauth_token;
    }

    this.someService = function (id, auth_token) {
        var deferred = $q.defer();

        $http.get('http://seats.dlldevstudio.ddemo.ru/api/get-seatplan?seatplan_id=' + $localStorage.information.seatplan_id + '&auth_token=' + auth_token).success(function (data) {
            deferred.resolve(data);
        }).error(function (error) {
            deferred.reject(error);
        });
        return deferred.promise;
    };
    this.updateSeat = function (oldID, newID, status, note, auth_token, seatplan_id) {
        var deferred = $q.defer();
        $http.post('http://seats.dlldevstudio.ddemo.ru/api/update-seat?seatplan_id=' + $localStorage.information.seatplan_id + '&old_id=' + oldID + '&new_id=' + newID + '&status=' + status + '&notes=' + note + '&auth_token=' + auth_token).success(function (data) {
            deferred.resolve(data);
        }).error(function (error) {
            deferred.reject(error);
        });

        return deferred.promise;
    };
    this.getSeat = function (id, auth_token) {
        var deferred = $q.defer();
        $http.post('http://seats.dlldevstudio.ddemo.ru/api/get-seat?seatplan_id=' + $localStorage.information.seatplan_id + '&seat_id=' + id + '&auth_token=' + auth_header).success(function (data) {
            deferred.resolve(data);
        }).error(function (error) {
            deferred.reject(error);
        });

        return deferred.promise;
    };
    this.saveSeat = function (id, status, seatplan_id) {
        var deferred = $q.defer();
        $http.post('http://seats.dlldevstudio.ddemo.ru/api/create-seat?seatplan_id=' + $localStorage.information.seatplan_id + '&internal_id=' + id + '&status=' + status + '&auth_token=' + auth_header).success(function (data) {
            deferred.resolve(data);
        }).error(function (error) {
            deferred.reject(error);
        });

        return deferred.promise;
    };
    this.getTower = function (id) {
        var deferred = $q.defer();
        $http.get('http://seats.dlldevstudio.ddemo.ru/api/get-seattower?area_id=' + id + '&auth_token=' + $localStorage.information.reauth_token).success(function (data) {
            data.quantity.booked = parseInt(data.quantity.booked);
            data.quantity.payed = parseInt(data.quantity.payed);
            data.quantity.unavailable = parseInt(data.quantity.unavailable);
            data.quantity.unpaid = parseInt(data.quantity.unpaid);

            deferred.resolve(data);
            //console.log(data);
        }).error(function (error) {
            console.log(error);
            deferred.reject(error);
        });
        return deferred.promise;
    };
    this.setTower = function (id) {
        var deferred = $q.defer();
        $http.get('http://seats.dlldevstudio.ddemo.ru/api/get-seattower?area_id=' + id + '&auth_token=' + $localStorage.information.reauth_token).success(function (data) {
            data.quantity.booked = parseInt(data.quantity.booked);
            data.quantity.payed = parseInt(data.quantity.payed);
            data.quantity.unavailable = parseInt(data.quantity.unavailable);
            data.quantity.unpaid = parseInt(data.quantity.unpaid);

            deferred.resolve(data);
        }).error(function (error) {
            console.log(error);
            deferred.reject(error);
        });
        return deferred.promise;
    };

    this.updateTower = function (area_id, action_type) {
        var deferred = $q.defer();
        $http.post('http://seats.dlldevstudio.ddemo.ru/api/update-area-seats?seattower_id=' + area_id + '&action=' + action_type + '&auth_token=' + $localStorage.information.reauth_token).success(function (data) {
            deferred.resolve(data);
        }).error(function (error) {
            deferred.reject(error);
        });

        return deferred.promise;
    };
}).service('AuthService', function ($q, $http, $localStorage, $state) {
    this.doLogin = function (user) {
        var deferred = $q.defer(),
            nonce_dfd = $q.defer(),
            authService = this;
        console.clear();
        console.log('user.userName', user.userName);
        console.log('user.password', user.password);
        $http.get('http://seats.dlldevstudio.ddemo.ru/api/login?login=' + user.userName + '&password=' + user.password).success(function (data) {
            if (data == "Your credentials does not match any account") {
                $localStorage.isLoggedIn = false;
                deferred.resolve(data);
            } else if(data.seatplan_id){
                $localStorage.isLoggedIn = true;
                deferred.resolve(data);
                alert('Seatplan ID '+ data.seatplan_id);
                $localStorage.information = {
                    seatplan_id: data.seatplan_id,
                    user_role: data.user_role,
                    reauth_token: data.reauth_token
                };
            }else{
                alert('Some error in the service');
            }
        }).error(function (error) {
            console.log(error);
            if (error == null) {
                alert('Error');
            }
            deferred.reject(error);
        });
        return deferred.promise;
    };
    this.userIsLoggedIn = function () {
        var deferred = $q.defer();
        var isLoggedIn = false;
        console.log('userIsLoggedIn?');
        console.log($localStorage);
        if ($localStorage.isLoggedIn == false) {
            console.log('There is nothing in localstorage');
            isLoggedIn = false;
            deferred.resolve(isLoggedIn);
        } else if ($localStorage.isLoggedIn == true && $localStorage.information) {
            console.log('TRUE');
            isLoggedIn = true;
            deferred.resolve(isLoggedIn);
        } else {
            isLoggedIn = false;
            deferred.resolve(isLoggedIn);
        }
        return deferred.promise;
    };
}).factory('$localstorage', ['$window', function ($window) {
    return {
        set: function set(key, value) {
            $window.localStorage[key] = value;
        },
        get: function get(key, defaultValue) {
            return $window.localStorage[key] || defaultValue;
        },
        setObject: function setObject(key, value) {
            $window.localStorage[key] = JSON.stringify(value);
        },
        getObject: function getObject(key) {
            try {
                return JSON.parse($window.localStorage[key] || '{}');
            } catch (error) {
                return JSON.parse('{}');
            }
        }
    };
}]).factory('$online', [function () {
    return {
        checkOnlineStat: function checkOnlineStat() {
            if (!navigator.onLine) {
                return 'Offline';
            } else {
                return 'Online';
            }
        },
        checkOnlineColor: function checkOnlineColor() {
            if (!navigator.onLine) {
                return 'Red';
            } else {
                return 'Green';
            }
        },
        checkOfflineData: function checkOfflineData(obj) {
            var size = 0,
                key;
            for (key in obj) {
                if (obj.hasOwnProperty(key)) size++;
            }
            return size;
        }
    };
}]);