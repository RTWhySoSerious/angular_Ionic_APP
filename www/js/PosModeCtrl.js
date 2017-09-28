'use strict';

posModeCtrl.$inject = ['$interval', '$online', '$cordovaGeolocation', '$rootScope', '$localstorage', '$scope', '$localStorage', '$translate', '$ionicPopover', '$ionicPopup', '$ionicLoading', '$state', '$timeout', '$http', 'GetINFOService'];
function posModeCtrl($interval, $online, $cordovaGeolocation, $rootScope, $localstorage, $scope, $localStorage, $translate, $ionicPopover, $ionicPopup, $ionicLoading, $state, $timeout, $http, GetINFOService) {

    //- DO NOT REMOVE AND MODIFY - This is very important object for copy and paste functionlaity
    var copiedObjects = new Array(),
        mods = 0,
        modRedo = 0,
        state = [],
        stackState = false,
        zoomRatio = 0.1;
    $scope.seatplan = {};
    $scope.seatplan.zoomlavel = 50;
    //-Extening of fabric js object for ID element.
    fabric.Object.prototype.toObject = function (toObject) {
        return function () {
            return fabric.util.object.extend(toObject.call(this), {
                id: this.id
            });
        };
    }(fabric.Object.prototype.toObject);

    // -Initializing of canvas element
    var canvas = new fabric.Canvas('canvas2');

    $scope.seatplan_id = $localStorage.information.seatplan_id;
    $scope.problems_count = 0;
    $scope.reserved_count = 0;
    $scope.used_count = 0;
    $scope.on_the_plan = 0;
    $scope.show_oneSeat_message = false;
    $scope.show_oneSeat_info = false;

    var timerId = setTimeout(function tick() {
        if (canvas.getActiveObject() == null) {
            $scope.oneSeat_info = false;
            $scope.twoSeatsArray = false;
        }
        timerId = setTimeout(tick, 2000);
    }, 2000);

    function groupAll(numberOfItems) {
        canvas.deactivateAll();
        canvas.discardActiveGroup();
        var objs = new Array();
        var canvasObjects = canvas.getObjects();
        var count = 0;
        for (var index = canvasObjects.length - 1; index >= 0; index--) {
            if (count < numberOfItems) objs.push(canvasObjects[index].set('active', true));
            count++;
        }
        var group = new fabric.Group(objs, {
            originX: 'center',
            originY: 'center'
        });
        canvas.setActiveGroup(group.setCoords()).renderAll();
    }
    var updateModifications = function updateModifications() {

        // var e, t;
        // if (!stackState) {
        //     if (state.length > 0 && state.length - 1 > mods) {
        //         var subState = [];
        //         // console.log(mods);
        //         for (key in state) {
        //             if (key <= mods) {
        //                 subState.push(state[key]);
        //             }
        //         }
        //         state = subState;
        //         // console.log(state.length);
        //         e = canvas.toJSON();
        //         t = JSON.stringify(e);
        //         state.push(t);
        //         mods = state.length - 1;
        //
        //     } else {
        //         e = canvas.toJSON();
        //         t = JSON.stringify(e);
        //         state.push(t);
        //         mods = state.length - 1;
        //     }
        // } else {
        //     console.log('[updateModifications] Stack false! Update stop...');
        // }
        // console.log(state.length + ' / ' + mods);
        // var selectObj = canvas.getActiveObject();

        // if (selectObj) {
        //     $scope.seat.top = selectObj.top;
        //     $scope.seat.left = selectObj.left;
        //     $scope.seat.scale = selectObj.scaleX * 2;
        // }
    };
    var toSVG = function toSVG() {
        var e = canvas.toSVG();
        window.open("data:image/svg+xml;utf8," + encodeURIComponent(e));
    };
    var toImage = function toImage(e) {
        var t = canvas.toDataURL();
        return e && void 0 != e ? t : void window.open(t);
    };
    $scope.show_controls = false; // to show range for the seat if true
    $scope.lvlBattery = null;
    // FUNCTION_BATTERY_STATUS
    navigator.getBattery().then(function (battery) {
        $scope.checkSendPopup = true;
        updateLevelInfo();
        battery.addEventListener('chargingchange', function () {
            $scope.chargingStatus = battery.charging;
            battery.charging ? $scope.checkSendPopup = false : $scope.checkSendPopup = true;
            // updateChargeInfo();
        });

        function updateLevelInfo() {
            $scope.lvlBattery = battery.level * 100;
            console.log("Battery level: " + battery.level * 100 + "%");
        }
        battery.addEventListener('chargingtimechange', function () {
            // updateChargingInfo();
        });
        // function updateChargingInfo(){
        //     console.log("Battery charging time: "
        //         + battery.chargingTime + " seconds");
        // }

        battery.addEventListener('dischargingtimechange', function () {
            // updateDischargingInfo();
        });
        // function updateDischargingInfo(){
        //     console.log("Battery discharging time: "
        //         + battery.dischargingTime + " seconds");
        // }
    });
    //__________________________

    //FUNCTION LOCATION CORDS


    $interval(function () {
        var posOptions = { timeout: 10000, enableHighAccuracy: false };
        $scope.coords = [];
        $cordovaGeolocation.getCurrentPosition(posOptions).then(function (position) {
            $scope.coords.push(position.coords.latitude, position.coords.longitude);
            $http.get('http://seats.dlldevstudio.ddemo.ru/api/update-gps-info?user_id=' + $scope.staff_id + '&battery_level=' + $scope.lvlBattery + '&coordinates=' + $scope.coords + '&auth_token=' + $localStorage.information.reauth_token).success(function (data) {
                // console.log(data);
            }).error(function (error) {
                console.log('cordovaGeolocation error');
            });
            console.log($scope.lvlBattery + '%');
        }, function (err) {
            console.log(err);
        });
    }, 50000);
    canvas.on("object:selected", function (e) {
        // console.log('Selected objects',e.target._objects);
        console.log('e.target', e.target);
        console.log($scope.price_left);
        console.log($scope.price_right);
        $scope.twoSeatsArray = false;
        $scope.oneSeat_info = false;
        $scope.selected_seat = {
            "id": "",
            "top": "",
            "left": "",
            "status": "",
            "scaleX": "",
            "scaleY": "",
            "width": "",
            "height": "",
            "message": "",
            "virtual": "",
            "twoSeats": "",
            "oneSeat": "",
            "price": ""
        };
        $scope.seat = {
            scale: 2,
            top: 150,
            left: 75
        };
        $scope.twoSeats_array = [];
        if (e.target.type == "group") {
            for (var i = 0; i < e.target._objects.length; i++) {
                var s_obj = e.target._objects[i];
                $scope.selected_seat.message = " ";
                console.log(s_obj);
                if (s_obj.status && s_obj.oneSeat) {
                    $scope.selected_seat.id = s_obj.id;
                    $scope.selected_seat.status = s_obj.status;
                    $scope.selected_seat.left = s_obj.left;
                    $scope.selected_seat.top = s_obj.top;
                    $scope.selected_seat.scaleX = s_obj.scaleX;
                    $scope.selected_seat.scaleY = s_obj.scaleY;
                    $scope.selected_seat.width = s_obj.width;
                    $scope.selected_seat.height = s_obj.height;
                    $scope.selected_seat.message = s_obj.message;
                    $scope.selected_seat.virtual = s_obj.virtual;
                    $scope.selected_seat.angle = s_obj.angle;
                    $scope.selected_seat.twoSeats = s_obj.twoSeats;
                    $scope.selected_seat.oneSeat = s_obj.oneSeat;
                    $scope.selected_seat.price = s_obj.price;
                    $scope.oneSeat_info = true;
                    $scope.show_controls = true;
                    canvas.renderAll();
                }if (s_obj.twoSeats) {
                    $scope.twoSeats_array.push(s_obj);
                }
            }
            if ($scope.twoSeats_array.length > 0) {
                // $scope.selected_seat.price_left = s_obj.price_left
                // $scope.selected_seat.price_right = s_obj.price_right
                $scope.twoSeats_info = $scope.twoSeats_array;
                $scope.twoSeatsArray = true;
            }
        }
        if (e.target.type == "image") {
            $scope.selected_seat.id = e.target.id;
            $scope.selected_seat.status = e.target.status;
            $scope.selected_seat.left = e.target.left;
            $scope.selected_seat.top = e.target.top;
            $scope.selected_seat.scaleX = e.target.scaleX;
            $scope.selected_seat.scaleY = e.target.scaleY;
            $scope.selected_seat.width = e.target.width;
            $scope.selected_seat.height = e.target.height;
            $scope.selected_seat.message = e.target.message;
            $scope.selected_seat.virtual = e.target.virtual;
            $scope.selected_seat.angle = e.target.angle;
            $scope.selected_seat.twoSeats = e.target.twoSeats;
            $scope.selected_seat.oneSeat = e.target.oneSeat;
            canvas.renderAll();
            $scope.show_controls = true;
        } else {
            $scope.show_controls = true;
        }
    });
    function checkOnline() {
        var online = navigator.onLine;
        if (online) {
            return true;
        } else if (!online) {
            return false;
        }
    }
    function loadJSON() {
        GetINFOService.someService($localStorage.information.seatplan_id, $localStorage.information.reauth_token).then(function (data) {
            $scope.available_seats = data[1].seats_count;
            var fullObj = data[1].json_snapshot;
            if (!!JSON.parse(data[1].json_snapshot).scale) {
                $scope.seatplan.zoomlavel = JSON.parse(data[1].json_snapshot).scale;
            }
            $scope.setZoom($scope.seatplan.zoomlavel);
            $scope.staff_id = data[1].staff_id;
            $scope.area_id = data[1].area_id;
            $scope.price_per_seat = data[1].price_per_seat;
            $scope.paid_count = data[1].paid_count;
            $scope.unpaid_count = data[1].unpaid_count;
            $scope.name = data[1].name;
            sortJSONdata(fullObj);
        });
    }
    loadJSON();
    function updateSeat_1(oldID, newID, status, note) {
        //if you want to change or ID or status and ID
        if (status == "used_seat") {
            $scope.paid_count++;
            $scope.unpaid_count--;
        } else if (status == "free_seat") {
            $scope.paid_count--;
            $scope.unpaid_count++;
            $scope.available_seats++;
            $scope.used_count--;
        }
        GetINFOService.updateSeat(oldID, newID, status, note, $localStorage.information.reauth_token, $scope.seatplan_id).then(function (data) {
            if (data = "success") {
                console.log(data);
                alertChangedSuccess();
            }
        });
        createTicket(newID);
    }
    function createTicket(seat_id) {
        $http.post('http://seats.dlldevstudio.ddemo.ru/api/create-ticket?seat_id=' + seat_id + '&seatplan_id=' + $scope.seatplan_id + '&auth_token=' + $localStorage.information.reauth_token).success(function (data) {
            console.log(data);
        }).error(function (error) {
            alert('Error creating a ticket');
        });
    }
    function changePrice(seat_id, price) {
        console.log('changePrice');
        console.log(seat_id);
        console.log(price);
        $http.post('http://seats.dlldevstudio.ddemo.ru/api/create-ticket?seat_id=' + seat_id + '&seatplan_id=' + $scope.seatplan_id + '&price=' + price + '&auth_token=' + $localStorage.information.reauth_token).success(function (data) {
            console.log(data);
            console.log($scope.oneSeat_info);
            console.log($scope.twoSeatsArray);
            $scope.price_per_seat = price;
        }).error(function (error) {
            console.log(error);
        });
    }
    function updateSeat_2(oldID, newID, status) {
        //if you want to change or ID or status and ID
        GetINFOService.updateSeat_2(oldID, newID, status).then(function (data) {});
    }
    function changeSeat(beforeSTATUS, afterSTATUS, target, newID) {
        if (afterSTATUS && newID) {
            //if you want to change both
            if (afterSTATUS == "free_seat") {
                updateSeat_1(target.id, newID, afterSTATUS, '');
                target._element.src = 'img/chair/green-chair-50.png';
                target.status = afterSTATUS;
                target.id = newID;
                return target;
            } else if (afterSTATUS == "used_seat") {
                seatCounters(beforeSTATUS, afterSTATUS);
                updateSeat_1(target.id, newID, afterSTATUS, '');
                target._element.src = 'img/chair/red-chair-50.png';
                target.status = afterSTATUS;
                target.id = newID;
                return target;
            } else if (afterSTATUS == "problem_seat") {
                seatCounters(beforeSTATUS, afterSTATUS);
                var myPopup = $ionicPopup.show({
                    template: '<input type="text" ng-model="data.inputt" placeholder="Asteroid crashed into a chair">',
                    title: 'Enter Message',
                    subTitle: '',
                    scope: $scope,
                    buttons: [{
                        text: 'Cancel'
                    }, {
                        text: '<b>Send</b>',
                        type: 'button-stable',
                        onTap: function onTap(e) {
                            if (!$scope.data.input) {
                                e.preventDefault();
                            } else {
                                updateSeat_1(target.id, newID, afterSTATUS, $scope.data.inputt);
                                target._element.src = 'img/chair/black-chair-50.png';
                                target.status = afterSTATUS;
                                target.id = newID;
                                target.message = $scope.data.inputt;
                            }
                        }
                    }]
                });
                return target;
            }
        }
    }
    function changeSeat_2(beforeSTATUS, afterSTATUS, target) {
        if (afterSTATUS == "free_seat") {
            updateSeat_1(target.id, target.id, afterSTATUS, '');
            target._element.src = 'img/chair/green-chair-50.png';
            target.status = afterSTATUS;
            return target;
        } else if (afterSTATUS == "used_seat") {
            seatCounters(beforeSTATUS, afterSTATUS);
            updateSeat_1(target.id, target.id, afterSTATUS, '');
            target._element.src = 'img/chair/red-chair-50.png';
            target.status = afterSTATUS;
            // $scope.paid_count ++
            // $scope.unpaid_count --
            return target;
        } else if (afterSTATUS == "problem_seat") {
            seatCounters(beforeSTATUS, afterSTATUS);
            var myPopup = $ionicPopup.show({
                template: '<input type="text" ng-model="data.inputt" placeholder="Asteroid crashed into a chair">',
                title: 'Enter Message',
                subTitle: '',
                scope: $scope,
                buttons: [{
                    text: 'Cancel'
                }, {
                    text: '<b>Send</b>',
                    type: 'button-stable',
                    onTap: function onTap(e) {
                        if (!$scope.data.input) {
                            e.preventDefault();
                        } else {
                            updateSeat_1(target.id, target.id, afterSTATUS, $scope.data.inputt);
                            target._element.src = 'img/chair/black-chair-50.png';
                            target.status = afterSTATUS;
                            target.message = $scope.data.inputt;
                            // console.log('The message has been sent');
                        }
                    }
                }]
            });

            return target;
        }
    }
    function changeSeat_StatusAndID(target, afterSTATUS, newID) {
        if (afterSTATUS == "free_seat") {
            updateSeat_1(target.id, newID, afterSTATUS, '');
            target._element.src = 'img/chair/green-chair-50.png';
            target.status = afterSTATUS;
            return target;
        } else if (afterSTATUS == "used_seat") {
            seatCounters(target.status, afterSTATUS);
            updateSeat_1(target.id, newID, afterSTATUS, '');
            target._element.src = 'img/chair/red-chair-50.png';
            target.status = afterSTATUS;
            return target;
        } else if (afterSTATUS == "problem_seat") {
            seatCounters(target.status, afterSTATUS);
            var myPopup = $ionicPopup.show({
                template: '<input type="text" ng-model="data.inputt" placeholder="Asteroid crashed into a chair">',
                title: 'Enter Message',
                subTitle: '',
                scope: $scope,
                buttons: [{
                    text: 'Cancel'
                }, {
                    text: '<b>Send</b>',
                    type: 'button-stable',
                    onTap: function onTap(e) {
                        if (!$scope.data.input) {
                            e.preventDefault();
                        } else {
                            updateSeat_1(target.id, newID, afterSTATUS, $scope.data.inputt);
                            target._element.src = 'img/chair/black-chair-50.png';
                            target.status = afterSTATUS;
                            target.message = $scope.data.inputt;
                        }
                    }
                }]
            });

            return target;
        }
    }
    function changeSeat_ID(target, beforeSTATUS, newID) {
        updateSeat_1(target.id, newID, beforeSTATUS, '');
        return target;
    }
    //_______________________________ ALERTS
    function alertSomeError() {
        var alertPopup = $ionicPopup.alert({
            template: '<div class="card"><div class="item item-text-wrap text-center"><h1>There was some Error</h1></div></div>',
            title: 'Error',
            buttons: [{
                text: 'OK',
                type: 'button button-assertive'
            }]
        });
        alertPopup.then(function (res) {});
    }
    function alertThisIDExists() {
        var alertPopup = $ionicPopup.alert({
            template: '<div class="card"><div class="item item-text-wrap text-center"><h1>This ID already exists</h1></div></div>',
            title: 'Warning Message',
            buttons: [{
                text: 'OK',
                type: 'button button-energized'
            }]
        });
        alertPopup.then(function (res) {});
    }
    function alertSameStatus() {
        var alertPopup = $ionicPopup.alert({
            template: '<div class="card"><div class="item item-text-wrap text-center"><h1>You cannot assign the same status to the chair</h1></div></div>',
            title: 'Warning Message',
            buttons: [{
                text: 'OK',
                type: 'button button-energized'
            }]
        });
        alertPopup.then(function (res) {});
    }
    function alertNotReggedID() {
        var alertPopup = $ionicPopup.alert({
            template: '<div class="card"><div class="item item-text-wrap text-center"><ul class="list"><li class="item "><h1 class="text-center">This seat is not registered yet</h1></li><li class="item"><h1 class="text-center">Please input ID</h1></li></ul></div></div>',
            title: 'Warning Message',
            buttons: [{
                text: 'OK',
                type: 'button button-energized'
            }]
        });
        alertPopup.then(function (res) {});
    }
    function alertOverTheLimit() {
        var alertPopup = $ionicPopup.alert({
            template: '<div class="card"><div class="item item-text-wrap text-center"><h1>This is over the limit</h1> </div></div>',
            title: 'Warning Message',
            buttons: [{
                text: 'OK',
                type: 'button button-energized'
            }]
        });
        alertPopup.then(function (res) {
            console.log('Over the limit');
        });
    }
    function alertSavedSuccess() {
        var alertPopup = $ionicPopup.alert({
            template: '<div class="card"><div class="item item-text-wrap text-center"><h1>The plan was saved</h1></div></div>',
            title: 'Success Message',
            buttons: [{
                text: 'OK',
                type: 'button button-calm'
            }]
        });
        alertPopup.then(function (res) {});
    }
    function alertChangedSuccess() {
        canvas.renderAll();
        var alertPopup = $ionicPopup.alert({
            template: '<div class="card"><div class="item item-text-wrap text-center"><h1>Changed successfully!</h1></div></div>',
            title: 'Success Message',
            buttons: [{
                text: 'OK',
                type: 'button button-calm'
            }]
        });
        alertPopup.then(function (res) {});
    }
    function alertSavedOffline() {
        var alertPopup = $ionicPopup.alert({
            template: '<div class="card"><div class="item item-text-wrap text-center"><h1>You are offline!</h1><p>Plan saved local and will be saved on the server when you are online </p></div></div>',
            title: 'Success Message',
            buttons: [{
                text: 'OK',
                type: 'button button-calm'
            }]
        });
        alertPopup.then(function (res) {});
    }
    function alertSavedError() {
        var alertPopup = $ionicPopup.alert({
            template: '<div class="card"><div class="item item-text-wrap text-center"><h1>There was a problem while saving a plan. Try again later</h1></div></div>',
            title: 'Warning Message',
            buttons: [{
                text: 'OK',
                type: 'button button-energized'
            }]
        });
        alertPopup.then(function (res) {});
    }
    function alertNothingSelected() {
        var alertPopup = $ionicPopup.alert({
            template: '<div class="card"><div class="item item-text-wrap text-center"><h1>You did not select any objects</h1></div></div>',
            title: 'Warning Message',
            buttons: [{
                text: 'OK',
                type: 'button button-energized'
            }]
        });
        alertPopup.then(function (res) {
            // console.log('Alert => done');
        });
    }
    //_______________________________ ___ALERTS
    function uploadToLocalStorage(target) {
        $localStorage.virtual_seats = [];
        $localStorage.virtual_seats.push(target);
    }
    var checkOfflineStatus = function checkOfflineStatus() {
        $scope.appStatus = $online.checkOnlineStat();
        $scope.deviceStatus = { text: $online.checkOnlineStat(), color: $online.checkOnlineColor() };
        if (checkOnline() && $online.checkOfflineData($localstorage.getObject('virtual_seats')) > 0) {
            var targets = $localstorage.getObject('virtual_seats'),
                targetsCount = $online.checkOfflineData(targets),
                preTarget = {};
            $scope.data = {};
            for (key in targets) {
                $scope.data.id = targets[key].id;
                GetINFOService.getSeat($scope.data.id) //check if this ID is in DB
                .then(function (data) {
                    if (data != 'Cannot find seat with provided id') {
                        delete targets[key];
                    } else if (data == 'Cannot find seat with provided id') {
                        // console.log('[Offline save] Try to save element on server...');
                        GetINFOService.saveSeat($scope.data.id, "free_seat", $scope.seatplan_id).then(function (data) {
                            if (data == 'success') {
                                $scope.showLoading(true);
                                canvas.renderAll();
                                $timeout(function () {
                                    $scope.showLoading(false);
                                }, 1000);
                            } else {
                                preTarget[$online.checkOfflineData(preTarget)] = targets[key];
                            }
                        });
                    }
                });
            }
            $localstorage.setObject('virtual_seats', preTarget);
        } else if (!checkOnline()) {
            // console.log('[Offline save] Offline');
        } else if ($online.checkOfflineData($localstorage.getObject('virtual_seats')) == 0) {
            // console.log('[Offline save] No offline saved seats');
        }

        var offlineSavedData = $localstorage.getObject('savedResult');
        if (checkOnline() && $online.checkOfflineData(offlineSavedData) > 0) {
            // console.log('[Offline save] Try to save offline saved data...!');
            $http.post('http://seats.dlldevstudio.ddemo.ru/api/save-seatplan?seatplan_id=' + offlineSavedData.seatplan_id + '&seats=' + offlineSavedData.seats + '&json_snapshot=' + offlineSavedData.json_snapshot + '&auth_token=' + $localStorage.information.reauth_token).success(function (data) {
                $scope.showLoading(true);

                $timeout(function () {
                    // console.log('Send JSON to DB => DONE');
                    alertSavedSuccess();
                    $scope.loadJSON();
                    $scope.showLoading(false);
                }, 1000);
                $localstorage.setObject('savedResult', {});
            }).error(function (error) {
                console.log(error);
                alertSavedError();
            });
        } else if ($online.checkOfflineData(offlineSavedData) == 0) {
            // console.log('[Offline save] No offline saved data');
        }
    };
    $interval(checkOfflineStatus, 5000);
    function checkStatus(target, id, status) {
        if (status = "free_seat") {
            target.src = 'img/chair/green-chair-50.png';
            target.id = id;
            target.copied = false;
        } else if (status = "used_seat") {
            target.src = 'img/chair/red-chair-50.png';
            target.id = id;
            target.copied = false;
        } else if (status = "problem_seat") {
            target.src = 'img/chair/black-chair-50.png';
            target.id = id;
            target.copied = false;
        }
        return target;
    }
    function popupStep2Virtual(target) {
        console.log('popupStep3Virtual');
        console.log(target);
        $scope.data = {};
        var myPopup = $ionicPopup.show({
            template: '<div class="card"><label class="item item-input"><input type="text" placeholder="Assign ID" ng-model="data.id"></label></div>',
            title: 'Register this chair please',
            subTitle: '',
            scope: $scope,
            buttons: [{
                text: 'Cancel',
                type: 'button-assertive'
            }, {
                text: '<b>Save</b>',
                type: 'button-balanced',
                onTap: function onTap(e) {
                    if ($scope.data.id) {
                        if (checkOnline()) {
                            GetINFOService.getSeat($scope.data.id) //check if this ID is in DB
                            .then(function (data) {
                                console.log('data', data);
                                if (data != 'Cannot find seat with provided id') {
                                    console.log('Error');
                                    alertThisIDExists();
                                } else if (data == 'Cannot find seat with provided id') {
                                    GetINFOService.saveSeat($scope.data.id, "free_seat", $scope.seatplan_id).then(function (data) {
                                        if (data == 'success') {
                                            console.log(' => REGISTERED');
                                            target.virtual = false;
                                            target._element.src = 'img/chair/green-chair-50.png';
                                            target.id = $scope.data.id;
                                            $scope.showLoading(true);
                                            canvas.renderAll();
                                            $timeout(function () {

                                                $scope.showLoading(false);
                                            }, 1000);
                                        } else {
                                            console.log(' => Change ID ENDED with ERROR');
                                        }
                                    });
                                }
                            });
                        } else if (!checkOnline()) {
                            console.log('Not online');
                            target.virtual = false;
                            target._element.src = 'img/chair/green-chair-50.png';
                            target.id = $scope.data.id;
                            var targets = $localstorage.getObject('virtual_seats');

                            targets[$online.checkOfflineData(targets)] = target;
                            $localstorage.setObject('virtual_seats', targets);

                            $scope.showLoading(true);
                            canvas.renderAll();
                            $timeout(function () {
                                $scope.showLoading(false);
                            }, 1000);
                        }
                    }
                } //onTap
            }]
        });
    }
    function popupStep3VirtualLeft(target) {
        console.log('popupStep3Virtual');
        console.log(target);
        $scope.data = {};
        var myPopup = $ionicPopup.show({
            template: '<div class="card"><label class="item item-input"><input type="text" placeholder="Assign ID" ng-model="data.id"></label></div>',
            title: 'Register this chair please',
            subTitle: '',
            scope: $scope,
            buttons: [{
                text: 'Cancel',
                type: 'button-assertive'
            }, {
                text: '<b>Save</b>',
                type: 'button-balanced',
                onTap: function onTap(e) {
                    if ($scope.data.id) {
                        if (checkOnline()) {
                            GetINFOService.getSeat($scope.data.id) //check if this ID is in DB
                            .then(function (data) {
                                console.log('data', data);
                                if (data != 'Cannot find seat with provided id') {
                                    console.log('Error');
                                    alertThisIDExists();
                                } else if (data == 'Cannot find seat with provided id') {
                                    GetINFOService.saveSeat($scope.data.id, "free_seat", $scope.seatplan_id).then(function (data) {
                                        if (data == 'success') {
                                            console.log(' => REGISTERED');
                                            target.virtual = false;
                                            target._element.src = 'img/chair/green-chair-50.png';
                                            target.id = $scope.data.id;
                                            $scope.showLoading(true);
                                            canvas.renderAll();
                                            $timeout(function () {

                                                $scope.showLoading(false);
                                            }, 1000);
                                        } else {
                                            console.log(' => Change ID ENDED with ERROR');
                                        }
                                    });
                                }
                            });
                        } else if (!checkOnline()) {
                            console.log('Not online');
                            target.virtual = false;
                            target._element.src = 'img/chair/green-chair-50.png';
                            target.id = $scope.data.id;
                            var targets = $localstorage.getObject('virtual_seats');

                            targets[$online.checkOfflineData(targets)] = target;
                            $localstorage.setObject('virtual_seats', targets);

                            $scope.showLoading(true);
                            canvas.renderAll();
                            $timeout(function () {
                                $scope.showLoading(false);
                            }, 1000);
                        }
                    }
                } //onTap
            }]
        });
    }
    function popupStep3VirtualRight(target) {
        console.log('popupStep3Virtual');
        console.log(target);
        $scope.data = {};
        var myPopup = $ionicPopup.show({
            template: '<div class="card"><label class="item item-input"><input type="text" placeholder="Assign ID" ng-model="data.id"></label></div>',
            title: 'Register this chair please',
            subTitle: '',
            scope: $scope,
            buttons: [{
                text: 'Cancel',
                type: 'button-assertive'
            }, {
                text: '<b>Save</b>',
                type: 'button-balanced',
                onTap: function onTap(e) {
                    if ($scope.data.id) {
                        if (checkOnline()) {
                            GetINFOService.getSeat($scope.data.id) //check if this ID is in DB
                            .then(function (data) {
                                console.log('data', data);
                                if (data != 'Cannot find seat with provided id') {
                                    console.log('Error');
                                    alertThisIDExists();
                                } else if (data == 'Cannot find seat with provided id') {
                                    GetINFOService.saveSeat($scope.data.id, "free_seat", $scope.seatplan_id).then(function (data) {
                                        if (data == 'success') {
                                            console.log(' => REGISTERED');
                                            target.virtual = false;
                                            target._element.src = 'img/chair/green-chair-50.png';
                                            target.id = $scope.data.id;
                                            $scope.showLoading(true);
                                            canvas.renderAll();
                                            $timeout(function () {

                                                $scope.showLoading(false);
                                            }, 1000);
                                        } else {
                                            console.log(' => Change ID ENDED with ERROR');
                                        }
                                    });
                                }
                            });
                        } else if (!checkOnline()) {
                            console.log('Not online');
                            target.virtual = false;
                            target._element.src = 'img/chair/green-chair-50.png';
                            target.id = $scope.data.id;
                            var targets = $localstorage.getObject('virtual_seats');

                            targets[$online.checkOfflineData(targets)] = target;
                            $localstorage.setObject('virtual_seats', targets);

                            $scope.showLoading(true);
                            canvas.renderAll();
                            $timeout(function () {
                                $scope.showLoading(false);
                            }, 1000);
                        }
                    }
                } //onTap
            }]
        });
    }
    function popupStep2NotVirtual(target) {
        $scope.data = {};
        var myPopup = $ionicPopup.show({
            template: '<div class="card"><label class="item item-input item-select"><div class="input-label">Status<h1>{{status}}</h1></div><select class="col button-light item-input item-select" ng-model="data.input"><option value="free_seat">Free</option><option value="used_seat">Used</option><option value="problem_seat">Issues</option></select></label></div><div class="card"><label class="item item-input"><input type="text" placeholder="Assign ID" ng-model="data.id"></label></div><div class="card"><label class="item item-input"><input type="text" placeholder="Assign price" ng-model="data.price"></label></div>',
            title: 'Choose Status Or Change ID',
            subTitle: '',
            scope: $scope,
            buttons: [{
                text: 'Cancel',
                type: 'button-assertive'
            }, {
                text: '<b>Save</b>',
                type: 'button-balanced',
                onTap: function onTap(e) {

                    if (target.status == $scope.data.input) {
                        e.preventDefault();
                        alertSameStatus();
                    } else if (!$scope.data.id && $scope.data.input) {

                        GetINFOService.getSeat(target.id, $localStorage.information.reauth_token).then(function (data) {

                            if (data == 'Cannot find seat with provided id') {
                                alertNotReggedID();
                            } else if (data != 'Cannot find seat with provided id') {
                                console.log($scope.data.price);
                                target = changeSeat_2(target.status, $scope.data.input, target);
                                if ($scope.data.price) {
                                    if (isNaN($scope.data.price)) {
                                        alert('Enter a number please');
                                    } else if (!isNaN($scope.data.price)) {
                                        changePrice(target.id, $scope.data.price);
                                        target.price = $scope.data.price;
                                    }
                                }
                                canvas.renderAll();
                            }
                        });
                    } else if ($scope.data.id && $scope.data.input) {
                        // console.log('Want to change both: status and ID');
                        console.log($scope.data.price);
                        target = changeSeat_StatusAndID(target, $scope.data.input, $scope.data.id);
                        target.id = $scope.data.id;
                        if ($scope.data.price) {
                            if (isNaN($scope.data.price)) {
                                alert('Enter a number please');
                            } else if (!isNaN($scope.data.price)) {
                                changePrice(target.id, $scope.data.price);
                                target.price = $scope.data.price;
                            }
                        }

                        canvas.renderAll();
                    } else if ($scope.data.id && !$scope.data.input) {
                        // console.log('Want to change only ID');
                        console.log($scope.data.price);
                        target = changeSeat_ID(target, target.status, $scope.data.id);
                        target.id = $scope.data.id;
                        if ($scope.data.price) {
                            if (isNaN($scope.data.price)) {
                                alert('Enter a number please');
                            } else if (!isNaN($scope.data.price)) {
                                changePrice(target.id, $scope.data.price);
                                target.price = $scope.data.price;
                            }
                        }
                        canvas.renderAll();
                    } else if (!$scope.data.id && !$scope.data.input && $scope.data.price) {
                        if ($scope.data.price) {
                            if (isNaN($scope.data.price)) {
                                alert('Enter a number please');
                            } else if (!isNaN($scope.data.price)) {
                                changePrice(target.id, $scope.data.price);
                                target.price = $scope.data.price;
                            }
                        }
                    }
                } //onTap
            }]
        });
    }
    function popupOneSeatStep1(_obj) {
        if (_obj.virtual) {
            popupStep2Virtual(_obj);
        } else if (!_obj.virtual && !_obj.copied) {
            popupStep2NotVirtual(_obj);
        }
    }
    function popupTwoSeatsVirtualStep1(_arr) {
        var leftSeat = {};
        var rightSeat = {};
        for (var i = 0; i < _arr.length; i++) {
            if (_arr[i].place === "left") {
                leftSeat = _arr[i];
            } else if (_arr[i].place === "right") {
                rightSeat = _arr[i];
            }
        }
        var myPopup = $ionicPopup.show({
            title: 'Change Left or Right seat',
            subTitle: '',
            scope: $scope,
            buttons: [{
                text: '<i class="fa fa-arrow-left"></i>',
                type: 'button-balanced ',
                onTap: function onTap(e) {
                    console.log(leftSeat.id);
                    if (leftSeat.id) {
                        popupStep3VirtualLeft(leftSeat);
                    } else {
                        alert("Already registered left seat");
                    }
                } //onTap
            }, {
                text: '<i class="fa fa-arrow-right"></i>',
                type: 'button-balanced ',
                onTap: function onTap(e) {
                    console.log(rightSeat.id);
                    if (rightSeat.id) {
                        popupStep3VirtualRight(rightSeat);
                    } else {
                        alert("Already registered right seat");
                    }
                } //onTap
            }, {
                text: '<i class="fa fa-times"></i>',
                type: 'close_btn'
            }]
        });
    }
    function popupTwoSeatsNotVirtualStep1(_arr) {
        var leftSeat = {};
        var rightSeat = {};
        for (var i = 0; i < _arr.length; i++) {
            if (_arr[i].place === "left") {
                leftSeat = _arr[i];
            } else if (_arr[i].place === "right") {
                rightSeat = _arr[i];
            }
        }
        if (leftSeat.id && rightSeat.id) {
            var myPopup = $ionicPopup.show({
                title: 'Change Left or Right seat',
                subTitle: '',
                scope: $scope,
                buttons: [{
                    text: '<i class="fa fa-arrow-left"></i>',
                    type: 'button-positive ',
                    onTap: function onTap(e) {
                        console.log(leftSeat.id);
                        if (leftSeat.id) {
                            popupTwoSeatsNotVirtualStep2Left(leftSeat);
                        } else {
                            alert("Already registered left seat");
                        }
                    } //onTap
                }, {
                    text: '<i class="fa fa-arrow-right"></i>',
                    type: 'button-positive ',
                    onTap: function onTap(e) {
                        console.log(rightSeat.id);
                        if (rightSeat.id) {
                            popupTwoSeatsNotVirtualStep2Right(rightSeat);
                        } else {
                            alert("Already registered right seat");
                        }
                    } //onTap
                }, {
                    text: '<i class="fa fa-times"></i>',
                    type: 'close_btn'
                }]
            });
        }
    }
    function popupTwoSeatsNotVirtualStep2Left(target) {
        $scope.data = {};
        var myPopup = $ionicPopup.show({
            template: '<div class="card"><label class="item item-input item-select"><div class="input-label">Status<h1>{{status}}</h1></div><select class="col button-light item-input item-select" ng-model="data.input"><option value="free_seat">Free</option><option value="used_seat">Used</option><option value="problem_seat">Issues</option></select></label></div><div class="card"><label class="item item-input"><input type="text" placeholder="Assign ID" ng-model="data.id"></label></div><div class="card"><label class="item item-input"><input type="text" placeholder="Assign Price" ng-model="data.price"></label></div>',
            title: 'Choose Status Or Change ID',
            subTitle: '',
            scope: $scope,
            buttons: [{
                text: 'Cancel',
                type: 'button-assertive'
            }, {
                text: '<b>Save</b>',
                type: 'button-balanced',
                onTap: function onTap(e) {
                    if (target.status == $scope.data.input) {
                        e.preventDefault();
                        alertSameStatus();
                    } else if (!$scope.data.id && $scope.data.input) {
                        GetINFOService.getSeat(target.id).then(function (data) {
                            if (data == 'Cannot find seat with provided id') {
                                alertNotReggedID();
                            } else if (data != 'Cannot find seat with provided id') {
                                target = changeSeat_2(target.status, $scope.data.input, target);
                                if ($scope.data.price) {
                                    if (isNaN($scope.data.price)) {
                                        alert('Enter a number please');
                                    } else if (!isNaN($scope.data.price)) {
                                        changePrice(target.id, $scope.data.price);
                                        target.price_left = $scope.data.price;
                                    }
                                }
                                canvas.renderAll();
                            }
                        });
                    } else if ($scope.data.id && $scope.data.input) {
                        // console.log('Want to change both: status and ID');
                        target = changeSeat_StatusAndID(target, $scope.data.input, $scope.data.id);
                        target.id = $scope.data.id;
                        if ($scope.data.price) {
                            if (isNaN($scope.data.price)) {
                                alert('Enter a number please');
                            } else if (!isNaN($scope.data.price)) {
                                changePrice(target.id, $scope.data.price);
                                target.price_left = $scope.data.price;
                            }
                        }

                        canvas.renderAll();
                    } else if ($scope.data.id && !$scope.data.input) {
                        // console.log('Want to change only ID');
                        target = changeSeat_ID(target, target.status, $scope.data.id);
                        target.id = $scope.data.id;
                        if ($scope.data.price) {
                            if (isNaN($scope.data.price)) {
                                alert('Enter a number please');
                            } else if (!isNaN($scope.data.price)) {
                                changePrice(target.id, $scope.data.price);
                                target.price_left = $scope.data.price;
                            }
                        }
                        canvas.renderAll();
                    } else if (!$scope.data.id && !$scope.data.input && $scope.data.price) {
                        if ($scope.data.price) {
                            if (isNaN($scope.data.price)) {
                                alert('Enter a number please');
                            } else if (!isNaN($scope.data.price)) {
                                changePrice(target.id, $scope.data.price);
                                target.price_left = $scope.data.price;
                            }
                        }
                    }
                } //onTap
            }]
        });
    }
    function popupTwoSeatsNotVirtualStep2Right(target) {
        $scope.data = {};
        var myPopup = $ionicPopup.show({
            template: '<div class="card"><label class="item item-input item-select"><div class="input-label">Status<h1>{{status}}</h1></div><select class="col button-light item-input item-select" ng-model="data.input"><option value="free_seat">Free</option><option value="used_seat">Used</option><option value="problem_seat">Issues</option></select></label></div><div class="card"><label class="item item-input"><input type="text" placeholder="Assign ID" ng-model="data.id"></label></div><div class="card"><label class="item item-input"><input type="text" placeholder="Assign price" ng-model="data.price"></label></div>',
            title: 'Choose Status Or Change ID',
            subTitle: '',
            scope: $scope,
            buttons: [{
                text: 'Cancel',
                type: 'button-assertive'
            }, {
                text: '<b>Save</b>',
                type: 'button-balanced',
                onTap: function onTap(e) {
                    if (target.status == $scope.data.input) {
                        e.preventDefault();
                        alertSameStatus();
                    } else if (!$scope.data.id && $scope.data.input) {
                        GetINFOService.getSeat(target.id).then(function (data) {
                            if (data == 'Cannot find seat with provided id') {
                                alertNotReggedID();
                            } else if (data != 'Cannot find seat with provided id') {
                                target = changeSeat_2(target.status, $scope.data.input, target);
                                if ($scope.data.price) {
                                    changePrice(target.id, $scope.data.price);
                                    target.price_right = $scope.data.price;
                                }
                                canvas.renderAll();
                            }
                        });
                    } else if ($scope.data.id && $scope.data.input) {
                        // console.log('Want to change both: status and ID');
                        target = changeSeat_StatusAndID(target, $scope.data.input, $scope.data.id);
                        target.id = $scope.data.id;
                        if ($scope.data.price) {
                            if (isNaN($scope.data.price)) {
                                alert('Enter a number please');
                            } else if (!isNaN($scope.data.price)) {
                                changePrice(target.id, $scope.data.price);
                                target.price_right = $scope.data.price;
                            }
                        }

                        canvas.renderAll();
                    } else if ($scope.data.id && !$scope.data.input) {
                        // console.log('Want to change only ID');
                        target = changeSeat_ID(target, target.status, $scope.data.id);
                        target.id = $scope.data.id;
                        if ($scope.data.price) {
                            if (isNaN($scope.data.price)) {
                                alert('Enter a number please');
                            } else if (!isNaN($scope.data.price)) {
                                changePrice(target.id, $scope.data.price);
                                target.price_right = $scope.data.price;
                            }
                        }
                        canvas.renderAll();
                    } else if (!$scope.data.id && !$scope.data.input && $scope.data.price) {
                        if ($scope.data.price) {
                            if (isNaN($scope.data.price)) {
                                alert('Enter a number please');
                            } else if (!isNaN($scope.data.price)) {
                                changePrice(target.id, $scope.data.price);
                                target.price_right = $scope.data.price;
                            }
                        }
                    }
                } //onTap
            }]
        });
    }
    function popupTwoSeatsStep0(_arr) {
        console.log(_arr);
        var virtualSeats = [];
        var notVirtual = [];
        for (var i = 0; i < _arr.length; i++) {
            if (_arr[i].virtual) {
                console.log('virtual dblseat');
                virtualSeats.push(_arr[i]);
            } else if (_arr[i].copied) {
                console.log('copied dblseat');
            } else if (!_arr[i].virtual && !_arr[i].copied) {
                console.log('real dblseat');
                notVirtual.push(_arr[i]);
            } else {
                alert('Error');
            }
        }
        if (virtualSeats.length > 0) {
            popupTwoSeatsVirtualStep1(virtualSeats);
        }
        if (notVirtual.length > 0) {
            popupTwoSeatsNotVirtualStep1(notVirtual);
        }
    }
    fabric.util.addListener(canvas.upperCanvasEl, 'dblclick', function (e) {

        var target = canvas.findTarget(e);
        if (!target) {
            return;
        }
        if (target.type == 'group') {
            if (target._objects[0].oneSeat || target._objects[1].oneSeat) {
                var temp = {};
                for (var i = 0; i < target._objects.length; i++) {
                    if (target._objects[i].oneSeat) {
                        temp = target._objects[i];
                    }
                }
                popupOneSeatStep1(temp);
            } else if (target._objects[0].twoSeats) {
                var temp1 = [];
                for (var _i = 0; _i < target._objects.length; _i++) {
                    temp1.push(target._objects[_i]);
                }
                var temp2 = [];
                for (var _i2 = 0; _i2 < temp1.length; _i2++) {
                    if (temp1[_i2].twoSeats) {
                        temp2.push(temp1[_i2]);
                    }
                }
                popupTwoSeatsStep0(temp2);
            } else if (!target._objects[0].mode) {
                $scope.data = {};
                var myPopup = $ionicPopup.show({
                    template: '<input type="text" autofocus ng-model="data.input">',
                    title: 'Enter Text',
                    subTitle: '',
                    scope: $scope,
                    buttons: [{ text: 'Cancel' }, {
                        text: '<b>Save</b>',
                        type: 'button-stable',
                        onTap: function onTap(e) {

                            if (!$scope.data.input) {
                                e.preventDefault();
                            } else {
                                setTableLabels($scope.data.input, target);
                            }
                        }
                    }]
                });
            }
        } else if (target.type == 'rect' || target.type == 'circle') {
            $scope.data = {};
            var myPopup = $ionicPopup.show({
                template: '<input type="text" autofocus ng-model="data.input">',
                title: 'Enter Text',
                subTitle: '',
                scope: $scope,
                buttons: [{ text: 'Cancel' }, {
                    text: '<b>Save</b>',
                    type: 'button-stable',
                    onTap: function onTap(e) {

                        if (!$scope.data.input) {
                            e.preventDefault();
                        } else {
                            setTableLabels($scope.data.input, target);
                        }
                    }
                }]
            });
        }
    });
    fabric.util.addListener(canvas.upperCanvasEl, 'click', function (e) {});
    // FUNCTION_SEAT
    $scope.addSeat = function () {
        popupDoubleSeat();
    };
    function popupDoubleSeat() {
        $ionicPopup.show({
            template: '',
            title: '1 seat or 2 seats?',
            buttons: [{
                text: '<b>1 seat</b>',
                type: 'button-balanced',
                onTap: function onTap(e) {
                    popupOneSeatLeftOrRight();
                } //onTap
            }, {
                text: '<b>2 seats</b>',
                type: 'button-balanced',
                onTap: function onTap(e) {
                    makeTwoSeats();
                } //onTap
            }, {
                text: '<i class="fa fa-times"></i>',
                type: 'close_btn'
            }]
        });
    }
    function popupOneSeatLeftOrRight() {
        $ionicPopup.show({
            template: '<h1 style="text-align:-webkit-center;">Left or Right?</h1>',
            title: 'Choose 1 seat',
            buttons: [{
                text: '<b>Left Seat</b>',
                type: 'button-balanced',
                onTap: function onTap(e) {
                    makeSeatWithSide('left');
                }
            }, {
                text: '<b>Right Seat</b>',
                type: 'button-balanced',
                onTap: function onTap(e) {
                    makeSeatWithSide('right');
                }
            }, {
                text: '<i class="fa fa-times"></i>',
                type: 'close_btn'
            }]
        });
    }
    function makeSeatWithSide(side) {
        var src_1 = 'img/umbrella.png';
        var t = new Image();
        t.onload = function () {
            fabric.Image.fromURL(src_1, function (umbrella) {
                umbrella.set({
                    left: 100,
                    top: 100,
                    opacity: 1,
                    width: 100,
                    height: 106,
                    id: 'umbrella_' + generateId(),
                    message: "",
                    src: src_1,
                    angle: 0,
                    mode: 'umbrella',
                    scaleX: 1,
                    scaleY: 1
                }).setCoords();
                if (side === 'left') {
                    makeLeftObject(umbrella);
                } else if (side === 'right') {
                    makeRightObject(umbrella);
                }
            });
        }, t.onerror = function () {
            alert("Got error here image not loading properly");
        }, t.src = src_1;
    }
    function makeLeftObject(umbrella) {
        var src_2 = 'img/chair/green-chair-not-registered.png';
        var t_2 = new Image();
        var leftCord = umbrella.left - 100;
        var rightCord = umbrella.left + 100;
        t_2.onload = function () {
            fabric.Image.fromURL(src_2, function (left) {
                left.set({
                    left: umbrella.left - 50,
                    top: umbrella.top,
                    opacity: 1,
                    width: 100,
                    height: 106,
                    id: generateId(),
                    message: "",
                    parentID: umbrella.id,
                    src: src_2,
                    place: 'left',
                    status: "free_seat",
                    angle: 0,
                    mode: 'seat',
                    oneSeat: true,
                    virtual: true,
                    scaleX: 1,
                    scaleY: 1
                }).setCoords();
                canvas.add(new fabric.Group([left, umbrella], {}));
                canvas.getActiveObject();
                canvas.renderAll();
            });
        }, t_2.onerror = function () {
            alert("Got error here image not loading properly");
        }, t_2.src = src_2;
    }
    function makeRightObject(umbrella) {
        var src_2 = 'img/chair/green-chair-not-registered.png';
        var t_2 = new Image();
        var leftCord = umbrella.left - 100;
        var rightCord = umbrella.left + 100;
        t_2.onload = function () {
            fabric.Image.fromURL(src_2, function (right) {
                right.set({
                    left: umbrella.left + 50,
                    top: umbrella.top,
                    opacity: 1,
                    width: 100,
                    height: 106,
                    id: generateId(),
                    message: "",
                    parentID: umbrella.id,
                    src: src_2,
                    place: 'right',
                    status: "free_seat",
                    angle: 0,
                    mode: 'seat',
                    oneSeat: true,
                    virtual: true,
                    scaleX: 1,
                    scaleY: 1
                }).setCoords();
                canvas.add(new fabric.Group([right, umbrella], {}));
                canvas.getActiveObject();
                canvas.renderAll();
            });
        }, t_2.onerror = function () {
            alert("Got error here image not loading properly");
        }, t_2.src = src_2;
    }
    function makeTwoSeats() {
        var src_1 = 'img/umbrella.png';
        var t = new Image();
        t.onload = function () {
            fabric.Image.fromURL(src_1, function (umbrella) {
                umbrella.set({
                    left: 100,
                    top: 100,
                    opacity: 1,
                    width: 100,
                    height: 106,
                    id: 'umbrella_' + generateId(),
                    src: src_1,
                    angle: 0,
                    mode: 'umbrella',
                    scaleX: 1,
                    scaleY: 1
                }).setCoords();
                makeObjectLeftAndRight(umbrella);
            });
        }, t.onerror = function () {
            alert("Got error here image not loading properly");
        }, t.src = src_1;
    }
    function makeObjectLeftAndRight(umbrella) {
        var src_2 = 'img/chair/green-chair-not-registered.png';
        var t_2 = new Image();
        t_2.onload = function () {
            fabric.Image.fromURL(src_2, function (left) {
                left.set({
                    left: umbrella.left - 50,
                    top: umbrella.top + 20,
                    opacity: 1,
                    width: 100,
                    height: 106,
                    id: generateId(),
                    message: " ",
                    parentID: umbrella.id,
                    src: src_2,
                    status: "free_seat",
                    angle: 0,
                    mode: 'seat',
                    twoSeats: true,
                    place: "left",
                    virtual: true,
                    scaleX: 1,
                    scaleY: 1
                }).setCoords();
                fabric.Image.fromURL(src_2, function (right) {
                    right.set({
                        left: umbrella.left + 50,
                        top: umbrella.top + 20,
                        opacity: 1,
                        width: 100,
                        height: 106,
                        id: generateId(),
                        message: " ",
                        parentID: umbrella.id,
                        src: src_2,
                        status: "free_seat",
                        angle: 0,
                        mode: 'seat',
                        twoSeats: true,
                        place: "right",
                        virtual: true,
                        scaleX: 1,
                        scaleY: 1
                    });
                    canvas.add(new fabric.Group([left, right, umbrella], {}));
                    canvas.getActiveObject();
                    canvas.renderAll();
                });
            });
        }, t_2.onerror = function () {
            alert("Got error here image not loading properly");
        }, t_2.src = src_2;
    }
    $scope.arraySeats = [];
    $scope.testCount = 0;
    function generateNewObjFromJSON(_obj, array) {
        var w = _obj.width;
        var h = _obj.height;
        var ScaleY = _obj.scaleY;
        var ScaleX = _obj.scaleX;
        var message = _obj.message;
        var left = _obj.left;
        var top = _obj.top;
        var id = _obj.id;
        var angle = _obj.angle;
        var mode = _obj.mode;
        var place = _obj.place;
        var src_1 = 'img/umbrella.png';
        var arraySeats = $scope.arraySeats[0];

        if (_obj.mode === 'umbrella') {
            // console.log(arraySeats);
            for (item in arraySeats) {
                $scope.testCount++;
                // console.log($scope.testCount);
                if (arraySeats[item].status == "free_seat") {
                    var src = 'img/chair/green-chair-50.png';
                } else if (arraySeats[item].status == "used_seat") {
                    var src = 'img/chair/red-chair-50.png';
                    seatCounters(arraySeats[item].status, arraySeats[item].status);
                } else if (arraySeats[item].status == "problem_seat") {
                    var src = 'img/chair/black-chair-50.png';
                    seatCounters(arraySeats[item].status, arraySeats[item].status);
                } else if (mode === "umbrella") {
                    var src = 'img/umbrella.png';
                }
                if (arraySeats[item].parentID === _obj.id) {
                    // console.log(arraySeats[item].parentID, '===', _obj.id);
                    if (arraySeats[item].place === 'left') {
                        var loc = _obj.left - 100;
                    } else if (arraySeats[item].place === 'right') {
                        var loc = _obj.left + 100;
                    }
                    var t = new Image();
                    t.onload = function () {
                        fabric.Image.fromURL(src_1, function (umbrella) {
                            umbrella.set({
                                left: left,
                                top: top,
                                opacity: 1,
                                width: w,
                                height: h,
                                id: id,
                                message: message,
                                src: src_1,
                                angle: angle,
                                mode: mode
                            }).setCoords();
                            fabric.Image.fromURL(src, function (img) {
                                img.set({
                                    left: loc,
                                    top: arraySeats[item].top,
                                    opacity: 1,
                                    width: arraySeats[item].width,
                                    height: arraySeats[item].height,
                                    id: arraySeats[item].id,
                                    message: arraySeats[item].message,
                                    scaleY: arraySeats[item].scaleY,
                                    scaleX: arraySeats[item].scaleX,
                                    angle: arraySeats[item].angle,
                                    parentID: arraySeats[item].parentID,
                                    place: arraySeats[item].place,
                                    mode: arraySeats[item].mode,
                                    status: arraySeats[item].status
                                }).setCoords(), canvas.add(new fabric.Group([umbrella, img], { top: top, left: left }));
                                canvas.renderAll();
                                $scope.on_the_plan++;
                            });
                        });
                    }, t.onerror = function () {
                        alert("Got error here image not loading properly");
                    }, t.src = src;
                }
            }
        }
    };
    // ___FUNCTION_SEAT
    var generateTextFromJSON = function generateTextFromJSON(_obj) {

        if (_obj.parentID) {
            for (var i = 0; i < canvas._objects.length; i++) {
                if (canvas._objects[i].id === _obj.parentID) {
                    var figure = canvas._objects[i];
                    var _text = _obj._text;
                    var text = new fabric.IText(_text, {
                        fontFamily: 'Courier New',
                        fontSize: 20,
                        fill: '#000000',
                        originX: 'center',
                        originY: 'center',
                        parentID: _obj.parentID,
                        scaleX: figure.scaleX,
                        scaleY: figure.scaleY,
                        id: _obj.id,
                        _type: "i-text",
                        _text: _text
                    });
                    console.log(text);

                    var group = new fabric.Group([figure, text], {
                        left: figure.leftG,
                        top: figure.topG,
                        scaleX: figure.scaleXG,
                        scaleY: figure.scaleYG,
                        width: figure.width,
                        height: figure.height
                    });
                    canvas.remove(canvas._objects[i]);
                    canvas.add(group);
                }
            }
        } else {
            var _text = _obj._text;
            var text = new fabric.IText(_text, {
                fontFamily: 'Courier New',
                fontSize: 25,
                fill: '#000000',
                left: _obj.left,
                top: _obj.top,
                originX: 'center',
                originY: 'center',
                scaleX: _obj.scaleX,
                scaleY: _obj.scaleY,
                id: generateTextId(),
                _type: "i-text",
                _text: _text
            });
            canvas.add(text);
        };
        canvas.renderAll();
    };
    var setTableLabels = function setTableLabels(text, target) {
        if (target.type === 'group') {
            canvas.getActiveObject().item(1).set({
                text: text
            });
            canvas.renderAll();
        } else {
            console.log(target.top);
            var texts = new fabric.IText(text, {
                fontFamily: 'Courier New',
                fontSize: 20,
                fill: '#000000',
                left: target.left,
                top: target.top,
                originX: 'center',
                originY: 'center',
                parentID: target.id,
                id: generateTextId(),
                _type: "i-text"
            });
            var group = new fabric.Group([target, texts], {});
            canvas.remove(canvas.getActiveObject());
            canvas.add(group);
            canvas.getActiveObject();
            canvas.renderAll();
        }
    };
    function generateRectTableFromJSON(_obj) {
        var rect = new fabric.Rect({
            leftG: _obj.leftG,
            left: _obj.left,
            topG: _obj.topG,
            top: _obj.top,
            width: _obj.width,
            height: _obj.height,
            fill: 'rgba(0,0,0,0)',
            borderOpacityWhenMoving: .5,
            stroke: '#000000',
            strokeWidth: 2,
            strokeLineCap: "square",
            originX: 'center',
            originY: 'center',
            _type: _obj._type,
            id: _obj.id,
            scaleX: _obj.scaleX,
            scaleY: _obj.scaleY,
            scaleXG: _obj.scaleXG,
            scaleYG: _obj.scaleYG,
            lockMovementX: true,
            lockMovementY: true,
            lockRotation: true,
            lockScalingX: true,
            lockScalingY: true
        });
        canvas.add(rect);
        canvas.renderAll();
    };
    function generateCircleFromJSON(_obj) {
        var circle = new fabric.Circle({
            leftG: _obj.leftG,
            left: _obj.left,
            topG: _obj.topG,
            top: _obj.top,
            width: _obj.width,
            height: _obj.height,
            radius: _obj.radius,
            fill: 'rgba(0,0,0,0)',
            originX: 'center',
            originY: 'center',
            strokeWidth: 2,
            stroke: '#000000',
            _type: _obj._type,
            id: _obj.id,
            scaleX: _obj.scaleX,
            scaleY: _obj.scaleY,
            scaleXG: _obj.scaleXG,
            scaleYG: _obj.scaleYG,
            lockMovementX: true,
            lockMovementY: true,
            lockRotation: true,
            lockScalingX: true,
            lockScalingY: true
        });
        canvas.add(circle);
        canvas.renderAll();
    };
    // ___FUNCTION_CIRCLE
    function seatCounters(_first, _second) {
        //for generate object function
        if (_first == _second) {

            if (_first == "reserved_seat") {
                $scope.reserved_count++;
                $scope.available_seats--;
            } else if (_first == "used_seat") {
                $scope.used_count++;
                $scope.available_seats--;
            } else if (_first == "problem_seat") {
                $scope.problems_count++;
                $scope.available_seats--;
            }
            //do not change the free_counter
        } else if (_first != "free_seat" && _second != "free_seat") {

            //reserved_seat
            if (_first == "reserved_seat" && _second == "used_seat") {
                $scope.reserved_count--;
                $scope.used_count++;
            } else if (_first == "reserved_seat" && _second == "problem_seat") {
                $scope.reserved_count--;
                $scope.problems_count++;
            }

            //used_seat
            if (_first == "used_seat" && _second == "reserved_seat") {
                $scope.used_count--;
                $scope.reserved_count++;
            } else if (_first == "used_seat" && _second == "problem_seat") {
                $scope.used_count--;
                $scope.problems_count++;
            }

            //problem_seat
            if (_first == "problem_seat" && _second == "reserved_seat") {
                $scope.problems_count--;
                $scope.reserved_count++;
            } else if (_first == "problem_seat" && _second == "used_seat") {
                $scope.problems_count--;
                $scope.used_count++;
            }

            //change the free_counter
        } else {
            if (_first == "free_seat" && _second == "reserved_seat") {
                $scope.available_seats--;
                $scope.reserved_count++;
            } else if (_first == "free_seat" && _second == "used_seat") {
                $scope.available_seats--;
                $scope.used_count++;
            } else if (_first == "free_seat" && _second == "problem_seat") {
                $scope.available_seats--;
                $scope.problems_count++;
            }

            //reserved_seat
            if (_first == "reserved_seat" && _second == "free_seat") {
                $scope.available_seats++;
                $scope.reserved_count--;
            } else if (_first == "reserved_seat" && _second == "used_seat") {
                $scope.reserved_count--;
                $scope.used_count++;
                $scope.available_seats--;
            } else if (_first == "reserved_seat" && _second == "problem_seat") {
                $scope.reserved_count--;
                $scope.problems_count++;
                $scope.available_seats--;
            }

            //used_seat
            if (_first == "used_seat" && _second == "free_seat") {
                $scope.available_seats++;
                $scope.used_count--;
            } else if (_first == "used_seat" && _second == "reserved_seat") {
                $scope.used_count--;
                $scope.reserved_count++;
                $scope.available_seats--;
            } else if (_first == "used_seat" && _second == "problem_seat") {
                $scope.used_count--;
                $scope.problems_count++;
                $scope.available_seats--;
            }

            //problem_seat
            if (_first == "problem_seat" && _second == "free_seat") {
                $scope.available_seats++;
                $scope.problems_count--;
                $scope.on_the_plan++;
            } else if (_first == "problem_seat" && _second == "reserved_seat") {
                $scope.problems_count--;
                $scope.reserved_count++;
                $scope.available_seats--;
            } else if (_first == "problem_seat" && _second == "used_seat") {
                $scope.problems_count--;
                $scope.used_count++;
                $scope.available_seats--;
            }
        }
    }
    // FUNCTION_GENERATOR
    function generateId() {
        var id = "";
        var arrayNumbers = [];
        for (var i = 1; i < 101; i++) {
            arrayNumbers.push(i);
        }
        var arrayLetters = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'];
        var randomNumber = arrayNumbers[Math.floor(Math.random() * arrayNumbers.length)];
        var randomLetter = arrayLetters[Math.floor(Math.random() * arrayLetters.length)];
        id = "seat_" + randomNumber + randomLetter;
        return id;
    }
    function generateTextId() {
        var id = "";
        var arrayNumbers = [];
        for (var i = 1; i < 101; i++) {
            arrayNumbers.push(i);
        }
        var arrayLetters = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'];
        var randomNumber = arrayNumbers[Math.floor(Math.random() * arrayNumbers.length)];
        var randomLetter = arrayLetters[Math.floor(Math.random() * arrayLetters.length)];
        id = "text_" + randomNumber + randomLetter;
        return id;
    }
    function generateIdFigure(type) {
        var id = "";
        var arrayNumbers = [];
        for (var i = 1; i < 101; i++) {
            arrayNumbers.push(i);
        }
        var arrayLetters = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'];
        var randomNumber = arrayNumbers[Math.floor(Math.random() * arrayNumbers.length)];
        var randomLetter = arrayLetters[Math.floor(Math.random() * arrayLetters.length)];
        if (type == "rect") {
            id = "rect_" + randomNumber + randomLetter;
        } else if (type == "circle") {
            id = "circle_" + randomNumber + randomLetter;
        }
        return id;
    }

    // ___FUNCTION_GENERATOR

    function deleteFromDB(id) {
        $http.post('http://seats.dlldevstudio.ddemo.ru/api/delete-seat?seatplan_id=' + $localStorage.information.seatplan_id + '&seat_id=' + id + '&auth_token=' + $localStorage.information.reauth_token).success(function (data) {
            return data;
        }).error(function (error) {
            console.log(error);
            return error;
        });
    }
    $scope.trash = function () {
        if (canvas.getActiveGroup()) {
            var obj = canvas.getActiveGroup()._objects;

            var _loop = function _loop(i) {
                if (obj[i].type == 'group') {
                    console.log(obj[i]._objects[0].virtual);
                    if (obj[i]._objects[0].virtual) {
                        $scope.on_the_plan--;
                        canvas.remove(obj[i]);
                        canvas.renderAll();
                    } else {
                        GetINFOService.getSeat(obj[i]._objects[0].id).then(function (data) {
                            if (data == 'Cannot find seat with provided id' || obj[i].virtual) {
                                var showAlert = function showAlert() {
                                    var alertPopup = $ionicPopup.alert({
                                        template: '<div class="card"><div class="item item-text-wrap text-center"><ul class="list"><li class="item "><h1 class="text-center">This seat is not registered yet</h1></li><li class="item"><h1 class="text-center">Please input ID</h1></li></ul></div></div>',
                                        title: 'You cannot delete this seat',
                                        buttons: [{
                                            text: 'OK',
                                            type: 'button button-energized'
                                        }]
                                    });
                                    alertPopup.then(function (res) {});
                                };

                                showAlert();
                            } else if (data != 'Cannot find seat with provided id') {
                                var confirmPopup = $ionicPopup.confirm({
                                    title: 'Action confirm',
                                    template: '<div class="card"><div class="item item-text-wrap text-center"><h1>Do you want to delete this Seats?</h1></div></div>'

                                });
                                confirmPopup.then(function (res) {
                                    if (res) {
                                        if (obj[i]._objects[0].status != "free_seat") {
                                            $scope.on_the_plan--;
                                            for (var j = 0; i < obj[i]._objects.length; j++) {
                                                console.log('id free set', obj[i]._objects[j].id);
                                                seatCounters(obj[i]._objects[j].status, "free_seat");
                                                deleteFromDB(obj[i]._objects[j].id);
                                            }
                                            deleteFromDB(obj[i].id);
                                            canvas.remove(obj[i]);
                                        } else {
                                            console.log('обжи в группе', obj[i]._objects);
                                            console.log('длинна', obj[i]._objects.length);
                                            $scope.on_the_plan--;

                                            for (var _j = 0; _j < obj[i]._objects.length; _j++) {
                                                console.log('id', obj[i]._objects[_j].id);
                                                console.log('j', _j);
                                                // console.log('id v bd',obj[i]._objects[j].id);
                                                // deleteFromDB(obj[i]._objects[j].id)
                                            }
                                            canvas.remove(obj[i]);
                                            canvas.renderAll();
                                        }
                                    }
                                });
                            }
                        });
                    }
                } else {
                    canvas.remove(obj[i]);
                    canvas.renderAll();
                }
            };

            for (var i = 0; i < obj.length; i++) {
                _loop(i);
            }
        } else if (canvas.getActiveObject()) {
            console.log(canvas.getActiveObject());
            if (canvas.getActiveObject().type == 'group') {
                console.log(canvas.getActiveObject()._objects[0].virtual);
                if (canvas.getActiveObject()._objects[0].virtual) {
                    $scope.on_the_plan--;
                    canvas.remove(canvas.getActiveObject());
                    canvas.renderAll();
                } else {
                    GetINFOService.getSeat(canvas.getActiveObject()._objects[0].id).then(function (data) {
                        if (data == 'Cannot find seat with provided id' || canvas.getActiveObject().virtual) {
                            var showAlert = function showAlert() {
                                var alertPopup = $ionicPopup.alert({
                                    template: '<div class="card"><div class="item item-text-wrap text-center"><ul class="list"><li class="item "><h1 class="text-center">This seat is not registered yet</h1></li><li class="item"><h1 class="text-center">Please input ID</h1></li></ul></div></div>',
                                    title: 'You cannot delete this seat',
                                    buttons: [{
                                        text: 'OK',
                                        type: 'button button-energized'
                                    }]
                                });
                                alertPopup.then(function (res) {});
                            };

                            showAlert();
                        } else if (data != 'Cannot find seat with provided id') {
                            var confirmPopup = $ionicPopup.confirm({
                                title: 'Action confirm',
                                template: '<div class="card"><div class="item item-text-wrap text-center"><h1>Do you want to delete this Seats?</h1></div></div>'

                            });
                            confirmPopup.then(function (res) {
                                console.log(res);
                                if (res) {
                                    if (canvas.getActiveObject()._objects[0].status != "free_seat") {
                                        $scope.on_the_plan--;
                                        for (var i = 0; i < canvas.getActiveObject()._objects.length; i++) {
                                            console.log(canvas.getActiveObject()._objects[i].id);
                                            seatCounters(canvas.getActiveObject()._objects[i].status, "free_seat");
                                            deleteFromDB(canvas.getActiveObject()._objects[i].id);
                                        }
                                        deleteFromDB(canvas.getActiveObject().id);
                                        canvas.remove(canvas.getActiveObject());
                                    } else {
                                        console.log(canvas.getActiveObject()._objects);
                                        $scope.on_the_plan--;
                                        for (var _i3 = 0; _i3 < canvas.getActiveObject()._objects.length; _i3++) {
                                            console.log(canvas.getActiveObject()._objects[_i3].id);
                                            deleteFromDB(canvas.getActiveObject()._objects[_i3].id);
                                        }
                                        canvas.remove(canvas.getActiveObject());
                                    }
                                }
                            });
                        }
                    });
                }
            } else {
                canvas.remove(canvas.getActiveObject());
                canvas.renderAll();
            }
        } else if (!canvas.getActiveObject() || canvas.getActiveGroup()) {
            var showAlert = function showAlert() {
                var alertPopup = $ionicPopup.alert({
                    template: '<div class="card"><div class="item item-text-wrap text-center"><h1>You did not select any objects</h1></div></div>',
                    title: 'Warning Message',
                    buttons: [{
                        text: 'OK',
                        type: 'button button-energized'
                    }]
                });
                alertPopup.then(function (res) {
                    // console.log('Alert => done');
                });
            };

            showAlert();
        }
    };
    $scope.undo = function () {
        var c, t;
        stackState = true;
        if (mods === state.length) {
            modRedo = 0;
        }

        if (mods > 0) {
            canvas.clear();
            //canvas.clear();
            c = mods;
            t = state[c - 1];
            renderWithJson(t);
            mods--;
            modRedo = 1;
            //$("#_appRedo").removeClass("disable");
        } else {}
            //$("#_appUndo").addClass("disable");

            //canvas.renderAll();
        stackState = false;
    };
    $scope.redo = function () {
        var c, t;
        stackState = true;
        if (mods + 1 === state.length) {
            modRedo = 0;
        }
        if (modRedo > 0) {
            canvas.clear();
            c = mods;
            t = state[c + 1];
            renderWithJson(t);
            canvas.renderAll();
            mods++;
            //$("#_appUndo").removeClass("disable");
        } else {
                //$("#_appRedo").addClass("disable");
            }
    };
    $scope.reset = function () {
        var confirmPopup = $ionicPopup.confirm({
            title: 'Action confirm',
            template: '<div class="card"><div class="item item-text-wrap text-center"><h1>Do you want to reset the plan?</h1></div></div>'

        });
        confirmPopup.then(function (res) {
            if (res) {
                var showAlert = function showAlert() {
                    var alertPopup = $ionicPopup.alert({
                        template: '<div class="card"><div class="item item-text-wrap text-center"><h1>The plan was cleared successfully</h1> </div></div>',
                        title: 'Warning Message',
                        buttons: [{
                            text: 'OK',
                            type: 'button button-energized'
                        }]
                    });
                    alertPopup.then(function (res) {
                        $scope.seatplan.zoomlavel = 50;
                        // $scope.seat.top = 150;
                        // $scope.seat.left = 65;
                        // $scope.seat.scale = 2;
                        $scope.show_controls = !$scope.show_controls;
                        $scope.setZoom($scope.seatplan.zoomlavel);
                    });
                };

                canvas.clear();
                console.clear();
                $scope.problems_count = 0;
                $scope.reserved_count = 0;
                $scope.used_count = 0;
                $scope.on_the_plan = 0;
                $scope.paid_count = 0;
                $scope.unpaid_count = 0;
                $scope.available_seats = $scope.available_seats_before;


                showAlert();
            } else {
                // console.log('not confirm');
            }
        });
    };
    $scope.reset2 = function () {
        canvas.clear();
        $scope.problems_count = 0;
        $scope.reserved_count = 0;
        $scope.used_count = 0;
        $scope.on_the_plan = 0;
        $scope.available_seats = $scope.available_seats_before;
    };
    $scope.showLoading = function (flag) {
        flag = flag == undefined ? false : flag;
        if (flag == true || flag == 1) {
            $ionicLoading.show({
                content: 'Loading',
                animation: 'fade-in',
                showBackdrop: true,
                maxWidth: 200,
                showDelay: 0
            });
        } else {
            $ionicLoading.hide();
        }
    };
    $scope.setZoom = function (newZoomLevel) {
        var zoomVal;
        if (canvas.getActiveObject()) {
            if (newZoomLevel < 35) {
                zoomVal = 1 + (newZoomLevel - 50) / 60;
            } else {
                zoomVal = 1 + (newZoomLevel - 50) / 60;
            }
            canvas.zoomToPoint(new fabric.Point(canvas.getActiveObject().top, canvas.getActiveObject().top), zoomVal);
        } else {
            if (newZoomLevel < 35) {
                zoomVal = 1 + (newZoomLevel - 50) / 60;
            } else {
                zoomVal = 1 + (newZoomLevel - 50) / 60;
            }
            canvas.zoomToPoint(new fabric.Point(canvas.width / 2, canvas.height / 2), zoomVal);
        }
    };
    $scope.plusZoom = function (val) {
        if (val < 100) {
            $scope.seatplan.zoomlavel++;
            $scope.setZoom($scope.seatplan.zoomlavel);
        }
    };
    $scope.minusZoom = function (val) {
        if (val > 1) {
            $scope.seatplan.zoomlavel--;
            $scope.setZoom($scope.seatplan.zoomlavel);
        }
    };
    $scope.exit = function () {
        $http.get('http://seats.dlldevstudio.ddemo.ru/api/logout').success(function (data) {
            console.log(data);
            delete $localStorage.information;
            $state.go('app.login');
            console.log('Goodbye');
        }).error(function (error) {
            console.log(error);
        });
    };
    var toJson = function toJson() {
        var e = canvas.toJSON(),
            t = JSON.stringify(e);
        return e;
    };
    function isOverLimit() {
        if ($scope.on_the_plan > $scope.available_before) {
            alertOverTheLimit();
            $http.post('http://seats.dlldevstudio.ddemo.ru/api/seats-exceeded?seatplan_id=' + $scope.seatplan_id + '&auth_token=' + $localStorage.information.reauth_token).success(function (data) {
                // console.log(data);
            }).error(function (error) {
                console.log(error);
            });
            return true;
        } else {
            return false;
        }
    }
    $scope.save = function () {
        var seats_in_canvas_status = [];
        var seats_in_canvas = {};
        var seats_to_umbrella_in_canvas = {};
        var rect_in_canvas = {};
        var circle_in_canvas = {};
        var text_in_canvas = {};
        var group_umbrella_in_canvas = {};
        // var group_in_canvas = {}
        console.log('canvas', canvas._objects);
        if (!isOverLimit) {
            console.log('The letter has been sent');
        } else if (isOverLimit) {
            // console.log('Below limit, everything looks good');
        }
        for (var i = 0; i < canvas._objects.length; i++) {
            if (canvas._objects[i].type == 'rect') {
                rect_in_canvas[canvas._objects[i].id] = {
                    "id": canvas._objects[i].id,
                    "top": canvas._objects[i].top,
                    "left": canvas._objects[i].left,
                    "scaleX": canvas._objects[i].scaleX,
                    "scaleY": canvas._objects[i].scaleY,
                    "_type": canvas._objects[i]._type,
                    "width": canvas._objects[i].width,
                    "height": canvas._objects[i].height
                };
            } else if (canvas._objects[i].type == "i-text") {
                text_in_canvas[canvas._objects[i].id] = {
                    "id": canvas._objects[i].id,
                    "top": canvas._objects[i].top,
                    "left": canvas._objects[i].left,
                    "scaleX": canvas._objects[i].scaleX,
                    "scaleY": canvas._objects[i].scaleY,
                    "_type": canvas._objects[i]._type,
                    "fontFamily": canvas._objects[i].fontFamily,
                    "fontSize": canvas._objects[i].fontSize,
                    "width": canvas._objects[i].width,
                    "height": canvas._objects[i].height,
                    "_text": canvas._objects[i].text
                };
            } else if (canvas._objects[i].type == 'circle') {
                circle_in_canvas[canvas._objects[i].id] = {
                    "id": canvas._objects[i].id,
                    "top": canvas._objects[i].top,
                    "left": canvas._objects[i].left,
                    "scaleX": canvas._objects[i].scaleX,
                    "scaleY": canvas._objects[i].scaleY,
                    "_type": canvas._objects[i]._type,
                    "radius": canvas._objects[i].radius,
                    "width": canvas._objects[i].width,
                    "height": canvas._objects[i].height
                };
            } else if (canvas._objects[i].type = 'group') {
                for (var j = 0; j < canvas._objects[i]._objects.length; j++) {
                    if (canvas._objects[i]._objects[j].mode == "umbrella") {
                        group_umbrella_in_canvas[canvas._objects[i]._objects[j].id] = {
                            "id": canvas._objects[i]._objects[j].id,
                            "top": canvas._objects[i].top,
                            "left": canvas._objects[i].left,
                            "scaleX": canvas._objects[i].scaleX,
                            "scaleY": canvas._objects[i].scaleY,
                            "width": canvas._objects[i]._objects[j].width,
                            "height": canvas._objects[i]._objects[j].height,
                            "message": canvas._objects[i]._objects[j].message,
                            "angle": canvas._objects[i]._objects[j].angle,
                            "mode": canvas._objects[i]._objects[j].mode
                        };
                    }
                    if (canvas._objects[i]._objects[j].mode == "seat") {
                        seats_to_umbrella_in_canvas[canvas._objects[i]._objects[j].id] = {
                            "id": canvas._objects[i]._objects[j].id,
                            "top": canvas._objects[i].top,
                            "left": canvas._objects[i].left,
                            "scaleX": canvas._objects[i].scaleX,
                            "scaleY": canvas._objects[i].scaleY,
                            "width": canvas._objects[i]._objects[j].width,
                            "height": canvas._objects[i]._objects[j].height,
                            "message": canvas._objects[i]._objects[j].message,
                            "angle": canvas._objects[i]._objects[j].angle,
                            "parentID": canvas._objects[i]._objects[j].parentID,
                            "mode": canvas._objects[i]._objects[j].mode,
                            "status": canvas._objects[i]._objects[j].status,
                            "place": canvas._objects[i]._objects[j].place,
                            "oneSeat": canvas._objects[i]._objects[j].oneSeat,
                            "twoSeats": canvas._objects[i]._objects[j].twoSeats,
                            "price": canvas._objects[i]._objects[j].price,
                            "price_left": canvas._objects[i]._objects[j].price_left,
                            "price_right": canvas._objects[i]._objects[j].price_right
                        };
                    }
                    if (canvas._objects[i]._objects[j].type == 'circle') {
                        circle_in_canvas[canvas._objects[i]._objects[j].id] = {
                            "id": canvas._objects[i]._objects[j].id,
                            "top": canvas._objects[i]._objects[j].top,
                            "topG": canvas._objects[i].top,
                            "left": canvas._objects[i]._objects[j].left,
                            "leftG": canvas._objects[i].left,
                            "scaleX": canvas._objects[i]._objects.scaleX,
                            "scaleY": canvas._objects[i]._objects.scaleY,
                            "scaleXG": canvas._objects[i].scaleX,
                            "scaleYG": canvas._objects[i].scaleY,
                            "_type": canvas._objects[i]._objects[j]._type,
                            "angle": canvas._objects[i]._objects[j].angle,
                            "radius": canvas._objects[i]._objects[j].radius,
                            "width": canvas._objects[i]._objects[j].width,
                            "height": canvas._objects[i]._objects[j].height
                        };
                    }
                    if (canvas._objects[i]._objects[j].type == 'rect') {
                        rect_in_canvas[canvas._objects[i]._objects[j].id] = {
                            "id": canvas._objects[i]._objects[j].id,
                            "top": canvas._objects[i]._objects[j].top,
                            "topG": canvas._objects[i].top,
                            "left": canvas._objects[i]._objects[j].left,
                            "leftG": canvas._objects[i].left,
                            "scaleX": canvas._objects[i]._objects.scaleX,
                            "scaleY": canvas._objects[i]._objects.scaleY,
                            "scaleXG": canvas._objects[i].scaleX,
                            "scaleYG": canvas._objects[i].scaleY,
                            "_type": canvas._objects[i]._objects[j]._type,
                            "angle": canvas._objects[i]._objects[j].angle,
                            "width": canvas._objects[i]._objects[j].width,
                            "height": canvas._objects[i]._objects[j].height
                        };
                    } else if (canvas._objects[i]._objects[j].type == "i-text") {
                        text_in_canvas[canvas._objects[i]._objects[j].id] = {
                            "id": canvas._objects[i]._objects[j].id,
                            "top": canvas._objects[i]._objects[j].top,
                            "left": canvas._objects[i]._objects[j].left,
                            "scaleX": canvas._objects[i].scaleX,
                            "scaleY": canvas._objects[i].scaleY,
                            "_type": canvas._objects[i]._objects[j]._type,
                            "fontFamily": canvas._objects[i]._objects[j].fontFamily,
                            "fontSize": canvas._objects[i]._objects[j].fontSize,
                            "width": canvas._objects[i]._objects[j].width,
                            "height": canvas._objects[i]._objects[j].height,
                            "_text": canvas._objects[i]._objects[j].text,
                            "parentID": canvas._objects[i]._objects[j].parentID
                        };
                    }
                }
            }
        }

        var seatPlanMainInfo = {
            "available_seats": $scope.available_seats,
            "on_the_plan": $scope.on_the_plan,
            "used_count": $scope.used_count,
            "reserved_count": $scope.reserved_count,
            "problems_count": $scope.problems_count
        };
        var one_seat_array = [];
        var two_seats_array = [];
        var seats_ID_array = [];
        var scale = $scope.seatplan.zoomlavel;
        var temp = _.map(seats_to_umbrella_in_canvas, function (element, index) {
            if (element.oneSeat && !element.twoSeats) {
                one_seat_array.push(element);
            } else if (element.twoSeats && !element.oneSeat) {
                two_seats_array.push(element);
            }
            if (element.oneSeat || element.twoSeats) {
                seats_ID_array.push(element);
            }
        });
        var one_seat_object = {};
        for (var _i4 = 0; _i4 < one_seat_array.length; _i4++) {
            one_seat_object[one_seat_array[_i4].id] = {
                "id": one_seat_array[_i4].id,
                "top": one_seat_array[_i4].top,
                "left": one_seat_array[_i4].left,
                "scaleX": one_seat_array[_i4].scaleX,
                "scaleY": one_seat_array[_i4].scaleY,
                "width": one_seat_array[_i4].width,
                "height": one_seat_array[_i4].height,
                "message": one_seat_array[_i4].message,
                "angle": one_seat_array[_i4].angle,
                "parentID": one_seat_array[_i4].parentID,
                "mode": one_seat_array[_i4].mode,
                "status": one_seat_array[_i4].status,
                "place": one_seat_array[_i4].place,
                "oneSeat": one_seat_array[_i4].oneSeat,
                "price": one_seat_array[_i4].price
            };
        }
        var two_seats_object = {};
        for (var _i5 = 0; _i5 < two_seats_array.length; _i5++) {
            two_seats_object[two_seats_array[_i5].id] = {
                "id": two_seats_array[_i5].id,
                "scaleX": two_seats_array[_i5].scaleX,
                "scaleY": two_seats_array[_i5].scaleY,
                "width": two_seats_array[_i5].width,
                "height": two_seats_array[_i5].height,
                "message": two_seats_array[_i5].message,
                "parentID": two_seats_array[_i5].parentID,
                "mode": two_seats_array[_i5].mode,
                "status": two_seats_array[_i5].status,
                "place": two_seats_array[_i5].place,
                "twoSeats": two_seats_array[_i5].twoSeats,
                "price_left": two_seats_array[_i5].price_left,
                "price_right": two_seats_array[_i5].price_right
            };
        }
        console.log('group_umbrella_in_canvas', group_umbrella_in_canvas);
        console.log('two_seats_object', two_seats_object);
        console.log('one_seat_object', one_seat_object);
        var seats_object = {};
        for (var _i6 = 0; _i6 < seats_ID_array.length; _i6++) {
            seats_object[seats_ID_array[_i6].id] = {
                "id": seats_ID_array[_i6].id, "status": seats_ID_array[_i6].status
            };
        }

        var seatPlanAllInfoAObject = {
            seatPlanMainInfo: seatPlanMainInfo,
            seats_in_canvas: seats_in_canvas,
            one_seat_object: one_seat_object,
            two_seats_object: two_seats_object,
            group_umbrella_in_canvas: group_umbrella_in_canvas,
            rect_in_canvas: rect_in_canvas,
            circle_in_canvas: circle_in_canvas,
            text_in_canvas: text_in_canvas,
            scale: scale
        };
        var seats = JSON.stringify(seats_object);

        if (checkOnline()) {
            var req = {
                method: 'POST',
                url: 'http://seats.dlldevstudio.ddemo.ru/api/save-seatplan?seatplan_id=' + $scope.seatplan_id + '&seats=' + seats + '&auth_token=' + $localStorage.information.reauth_token,
                headers: {
                    'Content-Type': undefined
                },
                data: {
                    json_snapshot: JSON.stringify(seatPlanAllInfoAObject)
                }
            };

            $http(req).then(function (data) {
                console.log(data);
                if (data.statusText == "OK" && data.status == 200) {
                    $scope.showLoading(true);

                    $timeout(function () {
                        alertSavedSuccess();
                        $scope.reset2();
                        loadJSON();
                        $rootScope.$broadcast('loadJSONfromPosMode', false);
                        $scope.showLoading(false);
                    }, 1000);
                } else {
                    console.log('Error');
                    alertSavedError();
                }
            });
        } else {
            alertSavedOffline();
            var savedResult = {
                seatplanID: $scope.seatplan_id,
                seats: seats,
                json_snapshot: JSON.stringify(seatPlanAllInfoAObject)
            };
            $localstorage.setObject('savedResult', savedResult);
        }
    };
    function generateObjFromJSON(umbrella, oneSeatArray, twoSeatsArray) {
        var oneSeat = [];
        var twoSeats = [];
        var oneSeatMAP = _.map(oneSeatArray, function (element, index) {
            if (element.parentID === umbrella.id) {
                oneSeat.push(element);
            }
        });
        var twoSeatsMAP = _.map(twoSeatsArray, function (element, index) {
            if (element.parentID === umbrella.id) {
                twoSeats.push(element);
            }
        });
        if (twoSeats.length > 0) {
            generate2objects(umbrella, twoSeats);
        }
        if (oneSeat.length > 0) {
            if (oneSeat[0].parentID === umbrella.id) {
                generateOneObjectFromJSON(umbrella, oneSeat[0]);
            }
        }
        function generate2objects(umbrella, twoSeats) {
            var t = new Image();
            var umbrella_src = 'img/umbrella.png';
            t.onload = function () {
                fabric.Image.fromURL(umbrella_src, function (umbrella2) {
                    umbrella2.set({
                        left: umbrella.left,
                        top: umbrella.top,
                        opacity: 1,
                        width: umbrella.width,
                        height: umbrella.height,
                        id: umbrella.id,
                        src: umbrella_src,
                        angle: umbrella.angle,
                        mode: 'umbrella',
                        draggable: false
                    });
                    generateTwoObjectsFromJSON(umbrella2, twoSeats);
                });
            }, t.onerror = function () {
                alert("Got error here image not loading properly");
            }, t.src = umbrella_src;
        }
    };
    function generateTwoObjectsFromJSON(umbrella, seatsArray) {
        var scaleX = seatsArray[0].scaleX;
        var scaleY = seatsArray[0].scaleY;
        var umbrella_left = umbrella.left;
        var umbrella_top = umbrella.top;
        var src_2 = 'img/chair/green-chair-50.png';
        var t_2 = new Image();
        var leftSeat = {};
        var rightSeat = {};
        var leftSeatStatus = " ";
        var rightSeatStatus = " ";
        for (var i = 0; i < seatsArray.length; i++) {
            if (seatsArray[i].place === "left") {
                leftSeat = seatsArray[i];
                leftSeatStatus = seatsArray[i].status;
            } else if (seatsArray[i].place === "right") {
                rightSeat = seatsArray[i];
                rightSeatStatus = seatsArray[i].status;
            }
        }
        if (leftSeat.status == "free_seat") {
            var left_seat_src = 'img/chair/green-chair-50.png';
        } else if (leftSeat.status == "used_seat") {
            var left_seat_src = 'img/chair/red-chair-50.png';
            seatCounters(leftSeat.status, leftSeat.status);
        } else if (leftSeat.status == "problem_seat") {
            var left_seat_src = 'img/chair/black-chair-50.png';
            seatCounters(leftSeat.status, leftSeat.status);
        }

        if (rightSeat.status == "free_seat") {
            var right_seat_src = 'img/chair/green-chair-50.png';
        } else if (rightSeat.status == "used_seat") {
            var right_seat_src = 'img/chair/red-chair-50.png';
            seatCounters(rightSeat.status, rightSeat.status);
        } else if (rightSeat.status == "problem_seat") {
            var right_seat_src = 'img/chair/black-chair-50.png';
            seatCounters(rightSeat.status, rightSeat.status);
        }

        t_2.onload = function () {
            fabric.Image.fromURL(left_seat_src, function (left) {
                left.set({
                    left: umbrella.left - 50,
                    top: umbrella.top + 20,
                    opacity: 1,
                    width: leftSeat.width,
                    height: leftSeat.height,
                    id: leftSeat.id,
                    message: leftSeat.message,
                    parentID: umbrella.id,
                    src: left_seat_src,
                    status: leftSeat.status,
                    angle: leftSeat.angle,
                    price_left: leftSeat.price_left,
                    // scaleX:umbrella.scaleX,
                    // scaleY:umbrella.scaleY,
                    mode: 'seat',
                    place: leftSeat.place,
                    twoSeats: rightSeat.twoSeats
                }).setCoords();
                fabric.Image.fromURL(right_seat_src, function (right) {
                    right.set({
                        left: umbrella.left + 50,
                        top: umbrella.top + 20,
                        opacity: 1,
                        width: rightSeat.width,
                        height: rightSeat.height,
                        id: rightSeat.id,
                        message: rightSeat.message,
                        parentID: umbrella.id,
                        src: right_seat_src,
                        status: rightSeat.status,
                        angle: rightSeat.angle,
                        price_right: rightSeat.price_right,
                        // scaleX:umbrella.scaleX,
                        // scaleY:umbrella.scaleY,
                        mode: 'seat',
                        place: rightSeat.place,
                        twoSeats: rightSeat.twoSeats

                    });
                    $scope.on_the_plan++;
                    $scope.on_the_plan++;
                    // top:umbrella_top,left:umbrella_left,
                    var fullWidth = (umbrella.width + left.width + right.width) / 1.5;
                    var fullHeight = (umbrella.height + left.height) / 2 * 1.2;
                    canvas.add(new fabric.Group([left, right, umbrella], {
                        height: fullHeight,
                        width: fullWidth,
                        top: umbrella_top,
                        left: umbrella_left,
                        scaleX: scaleX,
                        scaleY: scaleY,
                        lockMovementX: true,
                        lockMovementY: true,
                        lockRotation: true,
                        lockScalingX: true,
                        lockScalingY: true
                    }));
                    canvas.setActiveObject(canvas.item(canvas.getObjects().length - 1));
                    canvas.getActiveObject();
                    canvas.renderAll();
                });
            });
        }, t_2.onerror = function () {
            alert("Got error here image not loading properly");
        }, t_2.src = src_2;
    }
    function generateOneObjectFromJSON(umbrella, seat) {
        var scaleX = seat.scaleX;
        var scaleY = seat.scaleY;
        var umbrella_width = umbrella.width;
        var umbrella_height = umbrella.height;
        var umbrella_ScaleY = umbrella.scaleY;
        var umbrella_ScaleX = umbrella.scaleX;
        var umbrella_left = umbrella.left;
        var umbrella_top = umbrella.top;
        var umbrella_id = umbrella.id;
        var umbrella_angle = umbrella.angle;
        var umbrella_src = 'img/umbrella.png';
        var mode = umbrella.mode;

        if (mode === 'umbrella') {
            if (seat.status == "free_seat") {
                var seat_src = 'img/chair/green-chair-50.png';
            } else if (seat.status == "used_seat") {
                var seat_src = 'img/chair/red-chair-50.png';
                seatCounters(seat.status, seat.status);
            } else if (seat.status == "problem_seat") {
                var seat_src = 'img/chair/black-chair-50.png';
                seatCounters(seat.status, seat.status);
            } else if (mode === "umbrella") {
                var seat_src = 'img/umbrella.png';
            }
        }
        if (seat.place === 'left') {
            var loc = umbrella_left - 50;
        } else if (seat.place === 'right') {
            var loc = umbrella_left + 50;
        }
        var t = new Image();
        t.onload = function () {
            fabric.Image.fromURL(umbrella_src, function (umbrella) {
                umbrella.set({
                    left: umbrella_left,
                    top: umbrella_top,
                    opacity: 1,
                    width: umbrella_width,
                    height: umbrella_height,
                    id: umbrella_id,
                    src: umbrella_src,
                    angle: umbrella_angle,
                    mode: mode
                }).setCoords();
                fabric.Image.fromURL(seat_src, function (img) {
                    img.set({
                        left: loc,
                        top: seat.top + 19,
                        opacity: 1,
                        width: seat.width,
                        height: seat.height,
                        id: seat.id,
                        message: seat.message,
                        angle: seat.angle,
                        parentID: seat.parentID,
                        place: seat.place,
                        mode: seat.mode,
                        status: seat.status,
                        oneSeat: seat.oneSeat,
                        price: seat.price
                    }).setCoords(), canvas.add(new fabric.Group([img, umbrella], {
                        top: umbrella_top,
                        left: umbrella_left,
                        scaleX: scaleX,
                        scaleY: scaleY,
                        lockMovementX: true,
                        lockMovementY: true,
                        lockRotation: true,
                        lockScalingX: true,
                        lockScalingY: true
                    })); //{top:seat.top,left:seat.left}

                    canvas.renderAll();
                    $scope.on_the_plan++;
                });
            });
        }, t.onerror = function () {
            alert("Got error here image not loading properly");
        }, t.src = umbrella_src;
    }
    function sortJSONdata(_obj) {
        function parseLodash(str) {
            return _.attempt(JSON.parse.bind(null, str));
        }

        var oneSeatTemp = [];
        var twoSeatsTemp = [];
        var umbrellaTemp = [];
        var rectTemp = [];
        var circleTemp = [];
        var textTemp = [];
        var arraySeatsID = [];

        var temp = parseLodash(_obj);

        var test = _.map(temp, function (element, index) {
            if (index == "group_umbrella_in_canvas") {
                umbrellaTemp.push(element);
            } else if (index == "one_seat_object") {
                oneSeatTemp.push(element);
            } else if (index == "two_seats_object") {
                twoSeatsTemp.push(element);
            } else if (index == "rect_in_canvas") {
                rectTemp.push(element);
            } else if (index == "text_in_canvas") {
                textTemp.push(element);
            } else if (index == "circle_in_canvas") {
                circleTemp.push(element);
            }
        });
        var umbrella = umbrellaTemp[0];
        var seats_one = oneSeatTemp[0];
        var seats_two = twoSeatsTemp[0];
        var rect = rectTemp[0];
        var circle = circleTemp[0];
        var text = textTemp[0];
        var umbrellaArray = [];
        var seatArray = [];
        var seatIDArray = [];
        var oneSeatArray = [];
        var twoSeatsArray = [];
        var umbrellaMAP = _.map(umbrella, function (element, index) {
            umbrellaArray.push(element);
        });
        for (var i = 0; i < umbrellaArray.length; i++) {
            generateObjFromJSON(umbrellaArray[i], seats_one, seats_two);
        }
        var rectMAP = _.map(rect, function (element, index) {
            generateRectTableFromJSON(element);
        });
        var circleMAP = _.map(circle, function (element, index) {
            generateCircleFromJSON(element);
        });
        var textMAP = _.map(text, function (element, index) {
            generateTextFromJSON(element);
        });
    }
    $scope.loadJSON = function () {
        var confirmPopup = $ionicPopup.confirm({
            title: 'Action confirm',
            template: '<div class="card"><div class="item item-text-wrap text-center"><h1>Do you want to load the plan? All changes will be reset</h1></div></div>'
        });
        confirmPopup.then(function (res) {
            if (res) {
                $scope.reset2();
                $scope.showLoading(true);
                GetINFOService.someService($localStorage.information.seatplan_id, $localStorage.information.reauth_token).then(function (data) {
                    $scope.available_seats = data[1].seats_count;
                    $scope.available_before = data[1].seats_count;
                    var fullObj = data[1].json_snapshot;
                    if (!!JSON.parse(data[1].json_snapshot).scale) {
                        $scope.seatplan.zoomlavel = JSON.parse(data[1].json_snapshot).scale;
                    }
                    $scope.setZoom($scope.seatplan.zoomlavel);
                    $scope.staff_id = data[1].staff_id;
                    $scope.area_id = data[1].area_id;
                    $scope.price_per_seat = data[1].price_per_seat;
                    $scope.paid_count = data[1].paid_count;
                    $scope.unpaid_count = data[1].unpaid_count;
                    $scope.name = data[1].name;
                    sortJSONdata(fullObj);
                });
                $timeout(function () {
                    $scope.showLoading(false);
                }, 1000);
            }
        });
    };
    $rootScope.$on('loadJSONfromSeatPlane', function (event) {
        $scope.reset2();
        loadJSON();
    });
}