'use strict';

seattowerCtrl.$inject = ['$scope', 'GetINFOService'];
function seattowerCtrl($scope, GetINFOService) {

    // TODO:: Replace test area id

    $scope.area_id = 18;

    GetINFOService.getTower($scope.area_id).then(function (data) {
        $scope.tower = data;
        console.log(data);
    });

    $scope.changeFree = function (type) {
        if (type == 'add' || type == 'decrease' && $scope.tower.quantity.free > 0) {
            GetINFOService.updateTower($scope.area_id, type).then(function (data) {
                if (data.result == 'success') {
                    $scope.tower.quantity.free = data.free_count;
                }
            });
        }
    };

    $scope.save = function () {
        alert("WIP");
    };
    $scope.undo = function () {
        alert("WIP");
    };
    $scope.exit = function () {
        alert("WIP");
    };
}