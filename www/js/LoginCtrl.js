'use strict';

LoginCtrl.$inject = ['$scope', '$state', '$ionicLoading', 'AuthService', '$localStorage'];
function LoginCtrl($scope, $state, $ionicLoading, AuthService, $localStorage) {
    $scope.user = {};
    console.log('LoginCtrl');
    $scope.doLogin = function () {

        $ionicLoading.show({
            template: 'Logging in...'
        });
        var user = {
            userName: $scope.user.userName,
            password: $scope.user.password
        };
        AuthService.doLogin(user).then(function (data) {
            console.log(data.user_role);
            if (data == "Your credentials does not match any account") {
                alert('Your credentials do not match any account');
                $state.go('app.login');
            }else if (data.user_role === 'superadmin'){
                $state.go('app.login');
            } else if (data.user_role === 'staff'){
                $state.go('app.seatplan');
            }else{
                alert('Error in login Ctrl');
            }
            $ionicLoading.hide();
        }, function (err) {
            $scope.error = err;
            $ionicLoading.hide();
        });
    };
}