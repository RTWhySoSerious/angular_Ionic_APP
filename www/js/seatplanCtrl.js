'use strict';

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

seatplanCtrl.$inject = ['$interval', '$online', '$cordovaGeolocation', '$rootScope', '$localstorage', '$scope', '$localStorage', '$translate', '$ionicPopover', '$ionicPopup', '$ionicLoading', '$state', '$timeout', '$http', 'GetINFOService'];
function seatplanCtrl($interval, $online, $cordovaGeolocation, $rootScope, $localstorage, $scope, $localStorage, $translate, $ionicPopover, $ionicPopup, $ionicLoading, $state, $timeout, $http, GetINFOService) {
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

    //-Initializing of canvas element
    var canvas = new fabric.Canvas('canvas');

    $scope.seatplan_id = $localStorage.information.seatplan_id;
    // $scope.seatplan_id = 2

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

    // FUNCTION_ important_not_touched (updateModifications,groupAll,toJson,toSVG,toImage,renderWithJson)
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
        $scope.changed = true;
        var e, t;
        if (!stackState) {

            if (state.length > 0 && state.length - 1 > mods) {
                var subState = [];
                // console.log(mods);
                for (key in state) {
                    if (key <= mods) {
                        subState.push(state[key]);
                    }
                }
                state = subState;
                // console.log(state.length);
                e = canvas.toJSON();
                t = JSON.stringify(e);
                state.push(t);
                mods = state.length - 1;
            } else {
                e = canvas.toJSON();
                t = JSON.stringify(e);
                state.push(t);
                mods = state.length - 1;
            }
        } else {
            console.log('[updateModifications] Stack false! Update stop...');
        }
        // console.log(state.length + ' / ' + mods);
        var selectObj = canvas.getActiveObject();

        if (selectObj) {
            $scope.seat.top = selectObj.top;
            $scope.seat.left = selectObj.left;
            $scope.seat.scale = selectObj.scaleX * 2;
        }
    };
    var toSVG = function toSVG() {
        var e = canvas.toSVG();
        window.open("data:image/svg+xml;utf8," + encodeURIComponent(e));
    };
    //-Export to image with url or datastring of the basis of argument
    var toImage = function toImage(e) {
        var t = canvas.toDataURL();
        return e && void 0 != e ? t : void window.open(t);
    };
    //-Render canvas with json
    var renderWithJson = function renderWithJson(objJson) {
        canvas.loadFromJSON(objJson, function (o, object) {
            canvas.renderAll.bind(canvas);
            var objIndex = canvas.getObjects().length > 1 ? canvas.getObjects().length - 1 : 0;
            if (objIndex > 0) {
                canvas.setActiveObject(canvas.item(objIndex));
            }
        });
    };
    // _ important_not_touched
    //___________________________
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

        battery.addEventListener('levelchange', function () {
            var lvlBattery = battery.level * 100;
            if (lvlBattery < 5 && !battery.charging && $scope.checkSendPopup) {
                $scope.checkSendPopup = false;
                var alertPopup = $ionicPopup.alert({
                    template: '<div class="card"><div class="item item-text-wrap text-center"><h1>The battery level is very low.</h1><h2>' + lvlBattery + '%</h2></div></div>',
                    title: 'Warning Message',
                    buttons: [{
                        text: 'OK',
                        type: 'button button-energized'
                    }]
                });
                $http.get('http://seats.dlldevstudio.ddemo.ru/api/battery-low-notification?user_id=' + $scope.staff_id + '&seatplan_id=' + $scope.area_id + '&auth_token=' + $localStorage.information.reauth_token).success(function (data) {}).error(function (error) {
                    alert(error);
                });
            }
            updateLevelInfo();
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


    // $interval(function () {
    var posOptions = { timeout: 10000, enableHighAccuracy: false };
    $scope.coords = [];

    $cordovaGeolocation.getCurrentPosition(posOptions).then(function (position) {
        $scope.coords.push(position.coords.latitude, position.coords.longitude);
        $http.get('http://seats.dlldevstudio.ddemo.ru/api/update-gps-info?user_id=' + $scope.staff_id + '&battery_level=' + $scope.lvlBattery + '&coordinates=' + $scope.coords + '&auth_token=' + $localStorage.information.reauth_token).success(function (data) {
            console.log(data);
        }).error(function (error) {
            console.log("cordovaGeolocation Error");
        });
    }, function (err) {
        console.log(err);
    });
    // },5000)

    //___________________________


    // FUNCTION_CANVAS_EVENTS

    canvas.on("object:selected", function (e) {
        // console.log('Selected objects',e.target);
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
            "oneSeat": ""
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
                    $scope.oneSeat_info = true;
                    $scope.show_controls = true;
                    canvas.renderAll();
                }if (s_obj.twoSeats) {
                    $scope.twoSeats_array.push(s_obj);
                }
            }
            if ($scope.twoSeats_array.length > 0) {
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
    $scope.setScale = function (_range) {
        canvas.getActiveObject().scale(parseFloat(_range / 2)).setCoords(0, 0);
        canvas.renderAll();
    };
    $scope.plusScale = function (val, max) {
        if (!canvas.getActiveObject()) {
            alertNothingSelected();
        } else {
            $scope.seat.scale = canvas.getActiveObject().scaleX * 2;
            if (val < max) {
                $scope.seat.scale++;
                $scope.setScale($scope.seat.scale);
            }
        }
    };
    $scope.minusScale = function (val, min) {
        if (!canvas.getActiveObject()) {
            alertNothingSelected();
        } else {
            $scope.seat.scale = canvas.getActiveObject().scaleX * 2;
            if (val > min) {
                $scope.seat.scale--;
                $scope.setScale($scope.seat.scale);
            }
        }
    };
    $scope.setTop = function (_range) {
        canvas.getActiveObject().setTop(parseInt(_range, 10)).setCoords();
        canvas.renderAll();
    };
    $scope.plusTop = function (val, max) {
        if (!canvas.getActiveObject()) {
            alertNothingSelected();
        } else {
            $scope.seat.top = canvas.getActiveObject().top;
            if (val < max) {
                $scope.seat.top += 20;
                $scope.setTop($scope.seat.top);
            }
        }
    };
    $scope.minusTop = function (val, min) {
        if (!canvas.getActiveObject()) {
            alertNothingSelected();
        } else {
            $scope.seat.top = canvas.getActiveObject().top;
            if (val > min) {
                $scope.seat.top -= 20;
                $scope.setTop($scope.seat.top);
            }
        }
    };
    $scope.setLeft = function (_range) {
        canvas.getActiveObject().setLeft(parseInt(_range, 10)).setCoords();
        canvas.renderAll();
    };
    $scope.plusLeft = function (val, max) {
        if (!canvas.getActiveObject()) {
            alertNothingSelected();
        } else {
            $scope.seat.left = canvas.getActiveObject().left;
            if (val < max) {
                $scope.seat.left += 25;
                $scope.setLeft($scope.seat.left);
            }
        }
    };
    $scope.minusLeft = function (val, min) {
        if (!canvas.getActiveObject()) {
            alertNothingSelected();
        } else {
            $scope.seat.left = canvas.getActiveObject().left;
            if (val > min) {
                $scope.seat.left -= 25;
                $scope.setLeft($scope.seat.left);
            }
        }
    };
    function checkOnline() {
        var online = navigator.onLine;
        if (online) {
            return true;
        } else if (!online) {
            return false;
        }
    }
    function updateSeat_1(oldID, newID, status, note) {
        //if you want to change or ID or status and ID
        GetINFOService.updateSeat(oldID, newID, status, note).then(function (data) {
            // console.log('[DB] => '+data+' => YES');
            // $scope.save()
            // console.log(' => Change STATUS END');

        });
    }
    function updateSeat_2(oldID, newID, status) {
        //if you want to change or ID or status and ID
        GetINFOService.updateSeat_2(oldID, newID, status).then(function (data) {
            // console.log(' updateSeat_2 Success? ',data);
        });
    }
    function changeSeat(beforeSTATUS, afterSTATUS, target, newID) {
        if (afterSTATUS && newID) {
            //if you want to change both
            // console.log("Change both");
            if (afterSTATUS == "free_seat") {
                // $scope.save()
                updateSeat_1(target.id, newID, afterSTATUS, '');
                target._element.src = 'img/chair/green-chair-50.png';
                target.status = afterSTATUS;
                target.id = newID;
                return target;
            } else if (afterSTATUS == "used_seat") {
                // $scope.save()
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
                                // $scope.save()
                                updateSeat_1(target.id, newID, afterSTATUS, $scope.data.inputt);
                                target._element.src = 'img/chair/black-chair-50.png';
                                target.status = afterSTATUS;
                                target.id = newID;
                                target.message = $scope.data.inputt;
                                // console.log('The message has been sent');
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
                            // console.log('The message has been sent');
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
        alertPopup.then(function (res) {
            // console.log(' => YES');
            // console.log(' => REGISTRATION ERROR');
            // console.log(' => Change ID ENDED with ERROR');
        });
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
        alertPopup.then(function (res) {
            // console.log(' => YES');
            // console.log(' => REGISTRATION ERROR');
            // console.log(' => Change ID ENDED with ERROR');
        });
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
        alertPopup.then(function (res) {
            // console.log(' => ERROR');
            // console.log(' => You cannot Assign the same status to a chair as before');
            // console.log(' => Change STATUS ENDED with ERROR');
        });
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
        alertPopup.then(function (res) {
            // console.log(' => NO');
            // console.log(' => CHANGE STATUS ERROR');
            // console.log(' => Change STATUS END');

        });
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
        // console.log($localStorage);
    }
    var checkOfflineStatus = function checkOfflineStatus() {
        // console.log('[Offline save] Try to check online status...');
        $scope.appStatus = $online.checkOnlineStat();
        $scope.deviceStatus = { text: $online.checkOnlineStat(), color: $online.checkOnlineColor()
            // console.log($scope.deviceStatus);
        };if (checkOnline() && $online.checkOfflineData($localstorage.getObject('virtual_seats')) > 0) {
            var targets = $localstorage.getObject('virtual_seats'),
                targetsCount = $online.checkOfflineData(targets),
                preTarget = {};

            // console.log('[Offline save] Get offline objects...!');
            // console.log('[Offline save] Found elements:' + targetsCount);

            $scope.data = {};

            for (key in targets) {
                $scope.data.id = targets[key].id;
                GetINFOService.getSeat($scope.data.id) //check if this ID is in DB
                .then(function (data) {
                    if (data != 'Cannot find seat with provided id') {
                        // console.log('[Offline save] Already exist!');
                        delete targets[key];
                    } else if (data == 'Cannot find seat with provided id') {
                        // console.log('[Offline save] Try to save element on server...');
                        GetINFOService.saveSeat($scope.data.id, "free_seat", $scope.seatplan_id).then(function (data) {
                            if (data == 'success') {
                                // console.log('Seat with ID ['+$scope.data.id+']');
                                // console.log(' => REGISTERED');

                                $scope.showLoading(true);
                                canvas.renderAll();
                                $timeout(function () {

                                    $scope.showLoading(false);
                                }, 1000);
                            } else {
                                preTarget[$online.checkOfflineData(preTarget)] = targets[key];
                                // console.log('Seat with ID ['+$scope.data.id+'] => REGISTRATION ERROR');
                                // console.log(' => ERROR',data);
                                // console.log(' => Change ID ENDED with ERROR');
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
        // console.log('target',target);
        // console.log('id',id);
        // console.log('status',status);
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
    updateModifications();
    canvas.on({
        'object:modified': updateModifications,
        'object:selected': updateModifications

    });
    function popupStep3VirtualLeft(target) {
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
                                // console.log('data', data);
                                if (data != 'Cannot find seat with provided id') {
                                    alertThisIDExists();
                                } else if (data == 'Cannot find seat with provided id') {
                                    GetINFOService.saveSeat($scope.data.id, "free_seat", $scope.seatplan_id).then(function (data) {
                                        if (data == 'success') {
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
                                            alert("Change ID ENDED with ERROR");
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
                                // console.log('data', data);
                                if (data != 'Cannot find seat with provided id') {
                                    alertThisIDExists();
                                } else if (data == 'Cannot find seat with provided id') {
                                    GetINFOService.saveSeat($scope.data.id, "free_seat", $scope.seatplan_id).then(function (data) {
                                        if (data == 'success') {
                                            target.virtual = false;
                                            target._element.src = 'img/chair/green-chair-50.png';
                                            target.id = $scope.data.id;
                                            $scope.showLoading(true);
                                            canvas.renderAll();
                                            $timeout(function () {

                                                $scope.showLoading(false);
                                            }, 1000);
                                        } else {
                                            alert("Change ID ENDED with ERROR");
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
        // return target
    }
    fabric.util.addListener(canvas.upperCanvasEl, 'dblclick', function (e) {

        var target = canvas.findTarget(e);
        if (!target) {
            return;
        }
        if (target.type == 'group') {
            if (!target._objects[0].mode) {
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
    fabric.util.addListener(canvas.upperCanvasEl, 'click', function (e) {
        // var selectObj = canvas.getActiveObject();
        // if (selectObj){
        //     $scope.seat.top = selectObj.top;
        //     $scope.seat.left = selectObj.left;
        //     $scope.seat.scale = selectObj.scaleX*2;
        // }
        // $scope.data = {};
        // console.log(canvas.getActiveObject())
    });
    // ___FUNCTION_CANVAS_EVENTS
    //___________________________

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
    function generateNewClonedObj(_obj) {
        var w = _obj.width;
        var h = _obj.height;
        var ScaleY = _obj.scaleY;
        var ScaleX = _obj.scaleX;
        var status = _obj.status;
        var message = _obj.message;
        var angle = _obj.angle;
        if (status == "free_seat") {
            var src = 'img/chair/green-chair-not-registered.png';
            $scope.on_the_plan++;
            // console.log('isOverLimit',isOverLimit());
            if (!isOverLimit) {
                console.log('The letter has been sent');
            } else if (isOverLimit) {
                // console.log('Below limit, everything looks good');
            }
        } else if (status == "used_seat") {
            var src = 'img/chair/red-chair-not-registered.png';
            seatCounters(status, status);
            $scope.on_the_plan++;
            // console.log('isOverLimit',isOverLimit());
            if (!isOverLimit) {
                console.log('The letter has been sent');
            } else if (isOverLimit) {
                // console.log('Below limit, everything looks good');
            }
        } else if (status == "problem_seat") {
            var src = 'img/chair/black-chair-not-registered.png';
            seatCounters(status, status);
            $scope.on_the_plan++;
            // console.log('isOverLimit',isOverLimit());
            if (!isOverLimit) {
                console.log('The letter has been sent');
            } else if (isOverLimit) {
                // console.log('Below limit, everything looks good');
            }
        }
        if ($scope.direction == "up") {
            var t = new Image();
            t.onload = function () {
                fabric.Image.fromURL(src, function (img) {
                    var _img$set;

                    img.set((_img$set = {
                        left: _obj.left,
                        top: _obj.top - 120,
                        opacity: 1,
                        width: w,
                        height: h,
                        id: generateId(),
                        status: status,
                        message: message,
                        scaleY: ScaleY,
                        scaleX: ScaleX
                    }, _defineProperty(_img$set, 'message', _obj.message), _defineProperty(_img$set, 'copied', true), _defineProperty(_img$set, 'angle', angle), _img$set)).setCoords(), canvas.add(img), canvas.renderAll(), canvas.setActiveObject(canvas.item(canvas.getObjects().length - 1));
                });
                canvas.renderAll();
                updateModifications();
            }, t.onerror = function () {
                alert("Got error here image not loading properly");
            }, t.src = src;
        } else if ($scope.direction == "left") {
            var t = new Image();
            t.onload = function () {
                fabric.Image.fromURL(src, function (img) {
                    var _img$set2;

                    img.set((_img$set2 = {
                        left: _obj.left - 120,
                        top: _obj.top,
                        opacity: 1,
                        width: w,
                        height: h,
                        id: generateId(),
                        status: status,
                        message: message,
                        scaleY: ScaleY,
                        scaleX: ScaleX
                    }, _defineProperty(_img$set2, 'message', _obj.message), _defineProperty(_img$set2, 'copied', true), _defineProperty(_img$set2, 'angle', angle), _img$set2)).setCoords(), canvas.add(img), canvas.renderAll(), canvas.setActiveObject(canvas.item(canvas.getObjects().length - 1));
                });
                canvas.renderAll();
                updateModifications();
            }, t.onerror = function () {
                alert("Got error here image not loading properly");
            }, t.src = src;
        } else if ($scope.direction == "right") {
            var t = new Image();
            t.onload = function () {
                fabric.Image.fromURL(src, function (img) {
                    var _img$set3;

                    img.set((_img$set3 = {
                        left: _obj.left + 120,
                        top: _obj.top,
                        opacity: 1,
                        width: w,
                        height: h,
                        id: generateId(),
                        status: status,
                        message: message,
                        scaleY: ScaleY,
                        scaleX: ScaleX
                    }, _defineProperty(_img$set3, 'message', _obj.message), _defineProperty(_img$set3, 'copied', true), _defineProperty(_img$set3, 'angle', angle), _img$set3)).setCoords(), canvas.add(img), canvas.renderAll(), canvas.setActiveObject(canvas.item(canvas.getObjects().length - 1));
                });
                canvas.renderAll();
                updateModifications();
            }, t.onerror = function () {
                alert("Got error here image not loading properly");
            }, t.src = src;
        } else if ($scope.direction == "down") {
            var t = new Image();
            t.onload = function () {
                fabric.Image.fromURL(src, function (img) {
                    var _img$set4;

                    img.set((_img$set4 = {
                        left: _obj.left,
                        top: _obj.top + 120,
                        opacity: 1,
                        width: w,
                        height: h,
                        id: generateId(),
                        status: status,
                        message: message,
                        scaleY: ScaleY,
                        scaleX: ScaleX
                    }, _defineProperty(_img$set4, 'message', _obj.message), _defineProperty(_img$set4, 'copied', true), _defineProperty(_img$set4, 'angle', angle), _img$set4)).setCoords(), canvas.add(img), canvas.renderAll(), canvas.setActiveObject(canvas.item(canvas.getObjects().length - 1));
                });
                canvas.renderAll();
                updateModifications();
            }, t.onerror = function () {
                alert("Got error here image not loading properly");
            }, t.src = src;
        } else {
            var t = new Image();
            t.onload = function () {
                fabric.Image.fromURL(src, function (img) {
                    var _img$set5;

                    img.set((_img$set5 = {
                        eft: _obj.left,
                        top: _obj.top + 120,
                        opacity: 1,
                        width: w,
                        height: h,
                        id: generateId(),
                        status: status,
                        message: message,
                        scaleY: ScaleY,
                        scaleX: ScaleX
                    }, _defineProperty(_img$set5, 'message', _obj.message), _defineProperty(_img$set5, 'copied', true), _defineProperty(_img$set5, 'angle', angle), _img$set5)).setCoords(), canvas.add(img), canvas.renderAll(), canvas.setActiveObject(canvas.item(canvas.getObjects().length - 1));
                });
                canvas.renderAll();
                updateModifications();
            }, t.onerror = function () {
                alert("Got error here image not loading properly");
            }, t.src = src;
        }
    };
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
            for (key in arraySeats) {
                $scope.testCount++;
                if (arraySeats[key].status == "free_seat") {
                    var src = 'img/chair/green-chair-50.png';
                } else if (arraySeats[key].status == "used_seat") {
                    var src = 'img/chair/red-chair-50.png';
                    seatCounters(arraySeats[key].status, arraySeats[key].status);
                } else if (arraySeats[key].status == "problem_seat") {
                    var src = 'img/chair/black-chair-50.png';
                    seatCounters(arraySeats[key].status, arraySeats[key].status);
                } else if (mode === "umbrella") {
                    var src = 'img/umbrella.png';
                }
                if (arraySeats[key].parentID === _obj.id) {
                    if (arraySeats[key].place === 'left') {
                        var loc = _obj.left - 100;
                    } else if (arraySeats[key].place === 'right') {
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
                                    top: arraySeats[key].top,
                                    opacity: 1,
                                    width: arraySeats[key].width,
                                    height: arraySeats[key].height,
                                    id: arraySeats[key].id,
                                    message: arraySeats[key].message,
                                    scaleY: arraySeats[key].scaleY,
                                    scaleX: arraySeats[key].scaleX,
                                    angle: arraySeats[key].angle,
                                    parentID: arraySeats[key].parentID,
                                    place: arraySeats[key].place,
                                    mode: arraySeats[key].mode,
                                    status: arraySeats[key].status
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
    //___________________________
    // FUNCTION_TEXT
    $scope.addText = function () {
        $scope.data = {};
        var myPopup = $ionicPopup.show({
            template: '<input type="text" ng-model="data.input">',
            title: 'Enter Text',
            subTitle: '',
            scope: $scope,
            buttons: [{
                text: 'Cancel'
            }, {
                text: '<b>Save</b>',
                type: 'button-stable',
                onTap: function onTap(e) {
                    if (!$scope.data.input) {
                        e.preventDefault();
                    } else {
                        generateText($scope.data.input, e.x, e.y);
                    }
                }
            }]
        });
    };
    var generateText = function generateText(text, x, y) {
        var text = new fabric.IText(text, {
            fontFamily: 'Courier New',
            fontSize: 20,
            fill: '#000000',
            left: 65,
            top: 150,
            originX: 'center',
            originY: 'center',
            id: generateTextId(),
            _type: "i-text",
            _text: text,
            x: x,
            y: y
        });
        canvas.add(text);
        canvas.renderAll();
    };
    var setTableLabelsOld = function setTableLabelsOld(text, target) {
        var text = new fabric.IText(text, {
            fontFamily: 'Courier New',
            fontSize: 16,
            fill: '#000000',
            originX: 'center',
            originY: 'center'
        });

        var left = target.left;
        var top = target.top;

        //Remove top and left params from the target
        delete target['top'];
        delete target['left'];

        var group = new fabric.Group([target, text], {
            left: left,
            top: top
        });
        canvas.add(group);
        group.setCoords();
        canvas.renderAll();

        //Remove target element
        canvas.remove(target);
    };
    var setTableLabels = function setTableLabels(text, target) {
        console.log(target);
        if (target.type === 'group') {
            canvas.getActiveObject().item(1).set({
                text: text
            });
            canvas.renderAll();
        } else {
            var x = target.scaleX;
            var y = target.scaleY;
            if (target.scaleX > 1 || target.scaleY > 1) {
                target.scaleX = 1;
                target.scaleY = 1;
            }
            var texts = new fabric.IText(text, {
                fontFamily: 'Courier New',
                fontSize: 20,
                fill: '#000000',
                left: target.left,
                top: target.top,
                originX: 'center',
                originY: 'center',
                scaleX: 1,
                scaleY: 1,
                parentID: target.id,
                id: generateTextId(),
                _type: "i-text"
            });

            target.scaleX = 1;
            target.scaleY = 1;
            var group = new fabric.Group([target, texts], {
                scaleX: x,
                scaleY: y
            });
            canvas.remove(canvas.getActiveObject());
            canvas.add(group);
            canvas.getActiveObject();
            canvas.renderAll();
        }
    };
    var generateTableLables = function generateTableLables(_obj) {
        var _text = _obj.text;
        var _scaleX = _obj.scaleX;
        var _scaleY = _obj.scaleY;
        var text = new fabric.IText(_text, {
            fontFamily: 'Courier New',
            fontSize: 20,
            fill: '#000000',
            left: 65,
            top: 150,
            originX: 'center',
            originY: 'center',
            scaleX: _scaleX,
            scaleY: _scaleY,
            id: generateTextId(),
            _type: "i-text"

        });
        canvas.add(text);
        canvas.renderAll();
    };
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
    // ___FUNCTION_TEXT
    //___________________________
    // FUNCTION_RECT
    $scope.addRectTable = function () {
        var objCount = canvas.getObjects().length ? canvas.getObjects().length : 0;
        var rect = new fabric.Rect({
            left: 65,
            top: 150,
            width: 100,
            height: 100,
            fill: 'rgba(0,0,0,0)',
            borderOpacityWhenMoving: .5,
            stroke: '#000000',
            strokeWidth: 2,
            //strokeDashArray: [3, 3],
            strokeLineCap: "square",
            originX: 'center',
            originY: 'center',
            _type: 'rect',
            id: generateIdFigure('rect'),
            scaleX: 1,
            scaleY: 1
        });
        canvas.add(rect);
        canvas.renderAll();
        canvas.setActiveObject(canvas.item(canvas.getObjects().length - 1));
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
            scaleYG: _obj.scaleYG
        });
        canvas.add(rect);
        canvas.renderAll();
    };
    // ___FUNCTION_RECT
    //___________________________

    // FUNCTION_CIRCLE
    $scope.addCircleTable = function () {
        var circle = new fabric.Circle({
            left: 65,
            top: 150,
            radius: 60,
            fill: 'rgba(0,0,0,0)',
            originX: 'center',
            originY: 'center',
            strokeWidth: 2,
            stroke: '#000000',
            _type: 'circle',
            id: generateIdFigure('circle'),
            scaleX: 1,
            scaleY: 1
        });
        canvas.add(circle);
        circle.draggable = false;
        canvas.renderAll();
        canvas.setActiveObject(canvas.item(canvas.getObjects().length - 1));
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
            scaleYG: _obj.scaleYG
        });
        canvas.add(circle);
        canvas.renderAll();
    };
    // ___FUNCTION_CIRCLE
    //___________________________
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
    //___________________________
    var copy = function copy() {
        copiedObjects = [];
        var activeGroup = canvas.getActiveGroup();
        if (activeGroup) {
            var objectsInGroup = activeGroup.getObjects();
            canvas.discardActiveGroup();
            objectsInGroup.forEach(function (object) {
                copiedObjects.push(object);
            });
            for (var i = 0; i < copiedObjects.length; i++) {
                generateNewClonedObj(copiedObjects[i]);
            }
        }
    };
    var paste = function paste() {
        var count = 0;
        if (copiedObjects.length > 1) {
            for (var index = copiedObjects.length - 1; index >= 0; index--) {
                if (fabric.util.getKlass(copiedObjects[index].type).async) {
                    copiedObjects[index].clone(function (clone) {
                        pasteOneByOne(clone);
                        count++;
                        if (count == copiedObjects.length) {
                            groupAll(copiedObjects.length);
                        }
                    });
                } else {
                    pasteOneByOne(copiedObjects[index].clone());
                    count++;
                    if (count == copiedObjects.length) {
                        groupAll(copiedObjects.length);
                    }
                }
            }
        }
    };
    function pasteOneByOne(clone) {
        clone.left += 100;
        clone.top += 100;
        clone.set('canvas', canvas);
        clone.setCoords();
        canvas.add(clone);
    };
    // CLONE FUNCTION
    $scope.clone = function () {
        console.clear();
        $scope.data = {};
        if (!canvas.getActiveObject() && !canvas.getActiveGroup()) {
            var showAlert = function showAlert() {
                var alertPopup = $ionicPopup.alert({
                    template: '<div class="card"><div class="item item-text-wrap text-center"><h1>You did not select any objects</h1></div></div>',
                    title: 'Sorry',
                    buttons: [{
                        text: 'OK',
                        type: 'button button-energized'
                    }]
                });
                alertPopup.then(function (res) {});
            };

            showAlert();
        } else if (canvas.getActiveObject()) {
            if (canvas.getActiveObject()._type == "rect" || canvas.getActiveObject()._type == "circle") {
                var showAlertOnlySeats = function showAlertOnlySeats() {
                    var alertPopup = $ionicPopup.alert({
                        template: '<div class="card"><div class="item item-text-wrap text-center"><h1>You can only clone seats</h1></div></div>',
                        title: 'Warning Message',
                        buttons: [{
                            text: 'OK',
                            type: 'button button-energized'
                        }]
                    });
                    alertPopup.then(function (res) {});
                };

                showAlertOnlySeats();
            } else {
                clonePopupOneObject();
            }
        } else if (canvas.getActiveGroup()) {
            if (canvas.getActiveGroup()._objects[0]._type == "rect" || canvas.getActiveGroup()._objects[0]._type == "circle") {
                var _showAlertOnlySeats = function _showAlertOnlySeats() {
                    var alertPopup = $ionicPopup.alert({
                        template: '<div class="card"><div class="item item-text-wrap text-center"><h1>You can only clone seats</h1></div></div>',
                        title: 'Warning Message',
                        buttons: [{
                            text: 'OK',
                            type: 'button button-energized'
                        }]
                    });
                    alertPopup.then(function (res) {});
                };

                _showAlertOnlySeats();
            } else {
                clonePopupGroup();
            }
        }
    };
    function clonePopupOneObject() {
        var myPopup = $ionicPopup.show({
            title: 'Choose a direction please',
            subTitle: '',
            scope: $scope,
            buttons: [{
                text: '<i class="fa fa-arrow-left"></i>',
                type: 'button-balanced ',
                onTap: function onTap(e) {
                    var direction = "left";
                    cloneSeatsStep1(direction);
                } //onTap
            }, {
                text: '<i class="fa fa-arrow-up"></i>',
                type: 'button-balanced ',
                onTap: function onTap(e) {
                    var direction = "up";
                    cloneSeatsStep1(direction);
                } //onTap
            }, {
                text: '<i class="fa fa-arrow-down"></i>',
                type: 'button-balanced ',
                onTap: function onTap(e) {
                    var direction = "down";
                    cloneSeatsStep1(direction);
                } //onTap
            }, {
                text: '<i class="fa fa-arrow-right"></i>',
                type: 'button-balanced ',
                onTap: function onTap(e) {
                    var direction = "right";
                    cloneSeatsStep1(direction);
                } //onTap
            }, {
                text: '<i class="fa fa-times"></i>',
                type: 'close_btn'
            }]
        });
    }
    function clonePopupGroup() {
        var myPopup = $ionicPopup.show({
            title: 'Choose a direction please',
            subTitle: '',
            scope: $scope,
            buttons: [{
                text: '<i class="fa fa-arrow-up"></i>',
                type: 'button-balanced ',
                onTap: function onTap(e) {
                    var direction = "up";
                    cloneSeatsStep1(direction);
                } //onTap
            }, {
                text: '<i class="fa fa-arrow-down"></i>',
                type: 'button-balanced ',
                onTap: function onTap(e) {
                    var direction = "down";
                    cloneSeatsStep1(direction);
                } //onTap
            }, {
                text: '<i class="fa fa-times"></i>',
                type: 'close_btn'
            }]
        });
    }
    function cloneSeatsStep1(direction) {
        if (canvas.getActiveGroup() != null) {
            if (direction === "left" || direction === "right") {
                alert('Not Finished canvas.getActiveGroup()');
            } else if (direction === "up" || direction === "down") {
                cloneSeatsMultipleObjects(canvas.getActiveGroup(), direction);
            }
        } else if (canvas.getActiveObject() != null) {
            cloneSeatsOneObject(canvas.getActiveObject(), direction);
        }
    }
    function cloneSeatsOneObject(activeObject, direction) {
        var topPosition = cloneHelperDirection(direction, activeObject)[0];
        var leftPosition = cloneHelperDirection(direction, activeObject)[1];
        if (activeObject.type === 'group') {
            var umbrella = {};
            var oneSeatArray = [];
            var twoSeatsArray = [];
            var twoSeats = [];
            for (var i = 0; i < activeObject._objects.length; i++) {
                var object = activeObject._objects[i];
                if (object.type === 'image') {
                    if (object.mode === 'umbrella') {
                        umbrella = object;
                    } else if (object.mode === 'seat') {
                        if (object.oneSeat) {
                            oneSeatArray.push(object);
                        } else if (object.twoSeats) {
                            twoSeatsArray.push(object);
                        }
                    }
                }
            }
            if (oneSeatArray.length > 0) {
                cloneSeatsStep2OneSeat(umbrella, oneSeatArray[0], topPosition, leftPosition, direction);
            }
            if (twoSeatsArray.length > 0) {
                cloneSeatsStep2TwoSeats(umbrella, twoSeatsArray, topPosition, leftPosition, direction);
            }
        }
    }
    function cloneSeatsMultipleObjects(activeGroup, direction) {
        var group = activeGroup._objects;
        var umbrellas_array = [];
        var oneSeat_array = [];
        var twoSeats_array = [];
        for (var i = 0; i < group.length; i++) {
            var object = group[i];
            if (object.type === 'group') {
                for (var _i = 0; _i < object._objects.length; _i++) {
                    var obj = object._objects[_i];
                    if (obj.mode === 'umbrella') {
                        umbrellas_array.push(obj);
                    } else if (obj.oneSeat) {
                        oneSeat_array.push(obj);
                    }
                }
            }
        }
        for (var _i2 = 0; _i2 < group.length; _i2++) {
            var object = group[_i2];
            if (object._objects.length === 3) {
                twoSeats_array.push(object);
            }
        }
        if (oneSeat_array.length != 0 && twoSeats_array.length == 0) {
            cloneHelperSortSeats(umbrellas_array, oneSeat_array, direction);
        } else if (twoSeats_array.length != 0 && oneSeat_array.length == 0) {
            cloneHelperSeparateTwoSeats(twoSeats_array, direction);
        } else {
            var showAlertDifferentObjects = function showAlertDifferentObjects() {
                var alertPopup = $ionicPopup.alert({
                    template: '<div class="card"><div class="item item-text-wrap text-center"><h1>Try cloning seats of the same type</h1></div></div>',
                    title: 'Types are different',
                    buttons: [{
                        text: 'OK',
                        type: 'button button-energized'
                    }]
                });
                alertPopup.then(function (res) {});
            };

            showAlertDifferentObjects();
        }
    }
    function cloneHelperSortSeats(_umbrellas, _oneSeat, direction) {
        if (_oneSeat.length != 0) {
            for (var i = 0; i < _umbrellas.length; i++) {
                var umbr = _umbrellas[i];
                if (umbr.id == _oneSeat[i].parentID) {
                    cloneHelperSeparateOneSeat(umbr, _oneSeat[i], direction);
                }
            }
        }
    }
    function cloneHelperSeparateOneSeat(_umbrella, _seat, direction) {
        var objectLeft = _umbrella.group.originalLeft;
        var objectTop = _umbrella.group.originalTop;
        var _scaleX = _umbrella.group.group.scaleX;
        var _scaleY = _umbrella.group.group.scaleY;
        cloneMultipleStep2OneSeat(_umbrella, _seat, objectTop, objectLeft, direction, _scaleX, _scaleY);
    }
    function cloneHelperSeparateTwoSeats(_group, direction) {
        for (var i = 0; i < _group.length; i++) {
            cloneHelperParseGroup(_group[i], direction);
        }
    }
    function cloneHelperDirection(_direction, _obj) {
        if (_direction === 'left') {
            var left = _obj.left - _obj.width / 2;
            var top = _obj.top + 10;
        } else if (_direction === 'right') {
            var left = _obj.left + _obj.width / 1.2;
            var top = _obj.top + 10;
        } else if (_direction === 'up') {
            var left = _obj.left + 20;
            var top = _obj.top - _obj.height;
        } else if (_direction === 'down') {
            var left = _obj.left + 20;
            var top = _obj.top + _obj.height;
        }
        return [top, left];
    }
    function cloneHelperDirectionMultiple(_top, _left, _direction, _obj, _seat) {
        if (_seat.place === "right") {
            if (_direction === 'up') {
                var left = _left;
                var top = _top - _obj.height;
            } else if (_direction === 'down') {
                var left = _left;
                var top = _top + _obj.height;
            }
        } else if (_seat.place === "left") {
            if (_direction === 'up') {
                var left = _left + _seat.width / 2;
                var top = _top - _obj.height;
            } else if (_direction === 'down') {
                var left = _left + _seat.width / 2;
                var top = _top + _obj.height;
            }
        }

        return [top, left];
    }
    function cloneMultipleHelperDirection(_direction, _obj) {
        if (_direction === 'left') {
            var left = _obj.left - _obj.width - 40;
            var top = _obj.top;
        } else if (_direction === 'right') {
            var left = _obj.left + _obj.width;
            var top = _obj.top;
        } else if (_direction === 'up') {
            var left = _obj.left - 30;
            var top = _obj.top - _obj.height;
        } else if (_direction === 'down') {
            var left = _obj.left - 30;
            var top = _obj.top + _obj.height;
        }
        return [top, left];
    }
    //+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
    //_______________________________________________________________________________________
    //ONE SEAT CLONE
    function cloneSeatsStep2OneSeat(umbrella, _seat, top, left, direction) {
        if (_seat.parentID === umbrella.id) {
            var copiedSeat = _seat;
        }
        cloneSeatsStep3OneSeatUmbrella(umbrella, copiedSeat, top, left, direction);
    }
    function cloneSeatsStep3OneSeatUmbrella(_umbrella, _seat, top, left, direction) {
        var scaleX = canvas.getActiveObject().scaleX;
        var scaleY = canvas.getActiveObject().scaleY;
        if (direction === "right") {
            left = left + _umbrella.width / 2;
        } else if (direction === "left") {
            left = left - _umbrella.width / 8;
        } else if (direction === "up") {
            left = left + _umbrella.width / 4 + 5;
        } else if (direction === "down") {
            left = left + _umbrella.width / 4 + 5;
        }
        var umbrella_src = 'img/umbrella.png';
        var t = new Image();
        t.onload = function () {

            fabric.Image.fromURL(umbrella_src, function (umbrella2) {
                umbrella2.set({
                    left: left,
                    top: top,
                    opacity: 1,
                    width: _umbrella.width,
                    height: _umbrella.height,
                    id: 'umbrella_' + generateId(),
                    src: umbrella_src,
                    angle: 0,
                    mode: _umbrella.mode
                }).setCoords();

                if (_seat.place == "left") {
                    cloneHelperLeftSeat(umbrella2, _seat, scaleX, scaleY);
                } else if (_seat.place == "right") {
                    cloneHelperRightSeat(umbrella2, _seat, scaleX, scaleY);
                }
            });
        }, t.onerror = function () {
            alert("Got error here image not loading properly");
        }, t.src = umbrella_src;
    }
    function cloneHelperLeftSeat(_umbrella, _seat, _scaleX, _scaleY) {
        if (_seat.status === "free_seat") {
            var src_2 = 'img/chair/green-chair-not-registered.png';
        } else if (_seat.status === "used_seat") {
            var src_2 = 'img/chair/red-chair-not-registered.png';
        } else if (_seat.status === "problem_seat") {
            var src_2 = 'img/chair/black-chair-not-registered.png';
        }
        var t_2 = new Image();
        t_2.onload = function () {
            fabric.Image.fromURL(src_2, function (seat) {
                seat.set({
                    left: _umbrella.left - 50,
                    top: _umbrella.top + 20,
                    opacity: 1,
                    width: 100,
                    height: 106,
                    id: generateId(),
                    message: " ",
                    parentID: _umbrella.id,
                    src: src_2,
                    status: _seat.status,
                    angle: 0,
                    mode: 'seat',
                    oneSeat: true,
                    place: _seat.place,
                    virtual: true
                }).setCoords();
                canvas.add(new fabric.Group([seat, _umbrella], { scaleX: _scaleX, scaleY: _scaleY }));
                canvas.getActiveObject();
                canvas.renderAll();
            });
        }, t_2.onerror = function () {
            alert("Got error here image not loading properly");
        }, t_2.src = src_2;
    }
    function cloneHelperRightSeat(_umbrella, _seat, _scaleX, _scaleY) {
        if (_seat.status === "free_seat") {
            var src_2 = 'img/chair/green-chair-not-registered.png';
        } else if (_seat.status === "used_seat") {
            var src_2 = 'img/chair/red-chair-not-registered.png';
        } else if (_seat.status === "problem_seat") {
            var src_2 = 'img/chair/black-chair-not-registered.png';
        }

        var t_2 = new Image();
        t_2.onload = function () {
            fabric.Image.fromURL(src_2, function (seat) {
                seat.set({
                    left: _umbrella.left + 50,
                    top: _umbrella.top + 20,
                    opacity: 1,
                    width: 100,
                    height: 106,
                    id: generateId(),
                    message: " ",
                    parentID: _umbrella.id,
                    src: src_2,
                    status: _seat.status,
                    angle: 0,
                    mode: 'seat',
                    oneSeat: true,
                    place: _seat.place,
                    virtual: true
                }).setCoords();
                canvas.add(new fabric.Group([seat, _umbrella], { scaleX: _scaleX, scaleY: _scaleY }));
                canvas.getActiveObject();
                canvas.renderAll();
            });
        }, t_2.onerror = function () {
            alert("Got error here image not loading properly");
        }, t_2.src = src_2;
    }
    //_______________________________________________________________________________________
    //TWO SEATS CLONE
    function cloneSeatsStep2TwoSeats(umbrella, _seats, top, left, direction) {
        cloneSeatsStep3TwoSeatsUmbrella(umbrella, _seats, top, left, direction);
    }
    function cloneSeatsStep3TwoSeatsUmbrella(_umbrella, _seats, top, left, direction) {
        if (direction === "right") {
            left = left + _umbrella.width / 2;
        } else if (direction === "left") {
            left = left - _umbrella.width / 8;
        } else if (direction === "up") {
            left = left + _umbrella.width / 4 + 5;
        } else if (direction === "down") {
            left = left + _umbrella.width / 4 + 5;
        }
        var umbrella_src = 'img/umbrella.png';
        var t = new Image();
        t.onload = function () {
            fabric.Image.fromURL(umbrella_src, function (umbrella2) {
                umbrella2.set({
                    left: left,
                    top: top,
                    opacity: 1,
                    width: _umbrella.width,
                    height: _umbrella.height,
                    id: 'umbrella_' + generateId(),
                    src: umbrella_src,
                    angle: 0,
                    mode: _umbrella.mode
                }).setCoords();
                cloneSeatsStep4TwoSeatsLeft(umbrella2, _seats);
            });
        }, t.onerror = function () {
            alert("Got error here image not loading properly");
        }, t.src = umbrella_src;
    }
    function cloneSeatsStep4TwoSeatsLeft(_umbrella, _seats) {
        var leftSeat = [];
        var rightSeat = [];
        for (var i = 0; i < _seats.length; i++) {
            if (_seats[i].place === "left") {
                leftSeat.push(_seats[i]);
            } else if (_seats[i].place === "right") {
                rightSeat.push(_seats[i]);
            }
        }
        if (leftSeat[0].status === "free_seat") {
            var src_left = 'img/chair/green-chair-not-registered.png';
        } else if (leftSeat[0].status === "used_seat") {
            var src_left = 'img/chair/red-chair-not-registered.png';
        } else if (leftSeat[0].status === "problem_seat") {
            var src_left = 'img/chair/black-chair-not-registered.png';
        }

        var t_2 = new Image();
        t_2.onload = function () {
            fabric.Image.fromURL(src_left, function (left) {
                left.set({
                    left: _umbrella.left - 50,
                    top: _umbrella.top + 20,
                    opacity: 1,
                    width: 100,
                    height: 106,
                    id: generateId(),
                    message: " ",
                    parentID: _umbrella.id,
                    src: src_left,
                    status: leftSeat[0].status,
                    angle: 0,
                    mode: 'seat',
                    twoSeats: true,
                    place: leftSeat[0].place,
                    virtual: true
                }).setCoords();
                cloneSeatsStep5TwoSeatsRight(_umbrella, left, rightSeat[0]);
            });
        }, t_2.onerror = function () {
            alert("Got error here image not loading properly");
        }, t_2.src = src_left;
    }
    function cloneSeatsStep5TwoSeatsRight(_umbrella, left, rightSeat) {
        var _scaleX = canvas.getActiveObject().scaleX;
        var _scaleY = canvas.getActiveObject().scaleY;
        if (rightSeat.status === "free_seat") {
            var src_right = 'img/chair/green-chair-not-registered.png';
        } else if (rightSeat.status === "used_seat") {
            var src_right = 'img/chair/red-chair-not-registered.png';
        } else if (rightSeat.status === "problem_seat") {
            var src_right = 'img/chair/black-chair-not-registered.png';
        }
        var t_2 = new Image();
        t_2.onload = function () {
            fabric.Image.fromURL(src_right, function (right) {
                right.set({
                    left: _umbrella.left + 50,
                    top: _umbrella.top + 20,
                    opacity: 1,
                    width: 100,
                    height: 106,
                    id: generateId(),
                    message: " ",
                    parentID: _umbrella.id,
                    src: src_right,
                    status: rightSeat.status,
                    angle: 0,
                    mode: 'seat',
                    twoSeats: true,
                    place: rightSeat.place,
                    virtual: true
                }).setCoords();
                canvas.add(new fabric.Group([left, right, _umbrella], { scaleX: _scaleX, scaleY: _scaleY }));
                canvas.getActiveObject();
                canvas.renderAll();
            });
        }, t_2.onerror = function () {
            alert("Got error here image not loading properly");
        }, t_2.src = src_right;
    }
    //_______________________________________________________________________________________
    //ONE SEAT FROM GROUP CLONE
    function cloneMultipleStep2OneSeat(_umbrella, _seat, _top, _left, direction, _scaleX, _scaleY) {
        var umbrella_src = 'img/umbrella.png';
        var top = cloneHelperDirectionMultiple(_top, _left, direction, _umbrella, _seat)[0];
        var left = cloneHelperDirectionMultiple(_top, _left, direction, _umbrella, _seat)[1];
        var t = new Image();
        t.onload = function () {
            fabric.Image.fromURL(umbrella_src, function (umbrella2) {
                umbrella2.set({
                    left: left,
                    top: top,
                    opacity: 1,
                    width: _umbrella.width,
                    height: _umbrella.height,
                    id: 'umbrella_' + generateId(),
                    src: umbrella_src,
                    angle: 0,
                    mode: _umbrella.mode
                }).setCoords();
                if (_seat.place == "left") {
                    cloneHelperLeftSeat(umbrella2, _seat, _scaleX, _scaleY);
                } else if (_seat.place == "right") {
                    cloneHelperRightSeat(umbrella2, _seat, _scaleX, _scaleY);
                }
            });
        }, t.onerror = function () {
            alert("Got error here image not loading properly");
        }, t.src = umbrella_src;
        // cloneMultipleStep3OneSeatUmbrella(umbrella, copiedSeat, top, left, direction)
    }
    function cloneMultipleStep3OneSeatLeft(_umbrella, _seat) {
        t.onload = function () {
            fabric.Image.fromURL(umbrella_src, function (left_seat) {
                left_seat.set({
                    left: left,
                    top: top,
                    opacity: 1,
                    width: _umbrella.width,
                    height: _umbrella.height,
                    id: 'umbrella_' + generateId(),
                    src: umbrella_src,
                    angle: 0,
                    mode: _umbrella.mode
                }).setCoords();
            });
        }, t.onerror = function () {
            alert("Got error here image not loading properly");
        }, t.src = umbrella_src;

        // console.log('_umbrella',_umbrella);
        // console.log('_seat',_seat);
    }
    function cloneMultipleStep3OneSeatRight(_umbrella, _seat) {
        t.onload = function () {
            fabric.Image.fromURL(umbrella_src, function (umbrella2) {
                umbrella2.set({
                    left: left,
                    top: top,
                    opacity: 1,
                    width: _umbrella.width,
                    height: _umbrella.height,
                    id: 'umbrella_' + generateId(),
                    src: umbrella_src,
                    angle: 0,
                    mode: _umbrella.mode
                }).setCoords();
            });
        }, t.onerror = function () {
            alert("Got error here image not loading properly");
        }, t.src = umbrella_src;
    }
    //_______________________________________________________________________________________
    //TWO SEATS FROM GROUP CLONE
    function cloneHelperParseGroup(_group, direction) {
        var _umbrella = {};
        var _seats = [];
        for (var i = 0; i < _group._objects.length; i++) {
            var obj = _group._objects[i];
            if (obj.mode == "umbrella") {
                _umbrella = obj;
            } else if (obj.twoSeats) {
                _seats.push(obj);
            }
        }
        var objectLeft = _umbrella.group.originalLeft;
        var objectTop = _umbrella.group.originalTop;
        var _scaleX = _umbrella.group.group.scaleX;
        var _scaleY = _umbrella.group.group.scaleY;
        cloneSeatsStep3TwoSeatsUmbrella2(_umbrella, _seats, objectTop, objectLeft, direction, _scaleX, _scaleY);
    }
    function cloneSeatsStep3TwoSeatsUmbrella2(_umbrella, _seats, _top, _left, direction, scaleX, scaleY) {
        var left = 0;
        var top = 0;
        if (direction === "up") {
            left = left + _left + _umbrella.width / 2;
            top = _top - _umbrella.height;
        } else if (direction === "down") {
            left = left + _left + _umbrella.width / 2;
            top = _top + _umbrella.height;
        }
        var umbrella_src = 'img/umbrella.png';
        var t = new Image();
        t.onload = function () {
            fabric.Image.fromURL(umbrella_src, function (umbrella2) {
                umbrella2.set({
                    left: left,
                    top: top,
                    opacity: 1,
                    width: _umbrella.width,
                    height: _umbrella.height,
                    id: 'umbrella_' + generateId(),
                    src: umbrella_src,
                    angle: 0,
                    mode: _umbrella.mode
                }).setCoords();
                cloneSeatsStep4TwoSeatsLeft2(umbrella2, _seats, scaleX, scaleY);
            });
        }, t.onerror = function () {
            alert("Got error here image not loading properly");
        }, t.src = umbrella_src;
    }
    function cloneSeatsStep4TwoSeatsLeft2(_umbrella, _seats, scaleX, scaleY) {
        var leftSeat = [];
        var rightSeat = [];
        for (var i = 0; i < _seats.length; i++) {
            if (_seats[i].place === "left") {
                leftSeat.push(_seats[i]);
            } else if (_seats[i].place === "right") {
                rightSeat.push(_seats[i]);
            }
        }
        if (leftSeat[0].status === "free_seat") {
            var src_left = 'img/chair/green-chair-not-registered.png';
        } else if (leftSeat[0].status === "used_seat") {
            var src_left = 'img/chair/red-chair-not-registered.png';
        } else if (leftSeat[0].status === "problem_seat") {
            var src_left = 'img/chair/black-chair-not-registered.png';
        }
        var t_2 = new Image();
        t_2.onload = function () {
            fabric.Image.fromURL(src_left, function (left) {
                left.set({
                    left: _umbrella.left - 50,
                    top: _umbrella.top + 20,
                    opacity: 1,
                    width: 100,
                    height: 106,
                    id: generateId(),
                    message: " ",
                    parentID: _umbrella.id,
                    src: src_left,
                    status: leftSeat[0].status,
                    angle: 0,
                    mode: 'seat',
                    twoSeats: true,
                    place: leftSeat[0].place,
                    virtual: true
                }).setCoords();
                cloneSeatsStep5TwoSeatsRight2(_umbrella, left, rightSeat[0], scaleX, scaleY);
            });
        }, t_2.onerror = function () {
            alert("Got error here image not loading properly");
        }, t_2.src = src_left;
    }
    function cloneSeatsStep5TwoSeatsRight2(_umbrella, left, rightSeat, scaleX, scaleY) {
        if (rightSeat.status === "free_seat") {
            var src_right = 'img/chair/green-chair-not-registered.png';
        } else if (rightSeat.status === "used_seat") {
            var src_right = 'img/chair/red-chair-not-registered.png';
        } else if (rightSeat.status === "problem_seat") {
            var src_right = 'img/chair/black-chair-not-registered.png';
        }
        var t_2 = new Image();
        t_2.onload = function () {
            fabric.Image.fromURL(src_right, function (right) {
                right.set({
                    left: _umbrella.left + 50,
                    top: _umbrella.top + 20,
                    opacity: 1,
                    width: 100,
                    height: 106,
                    id: generateId(),
                    message: " ",
                    parentID: _umbrella.id,
                    src: src_right,
                    status: rightSeat.status,
                    angle: 0,
                    mode: 'seat',
                    twoSeats: true,
                    place: rightSeat.place,
                    virtual: true
                }).setCoords();
                canvas.add(new fabric.Group([left, right, _umbrella], { scaleX: scaleX, scaleY: scaleY }));
                canvas.getActiveObject();
                canvas.renderAll();
            });
        }, t_2.onerror = function () {
            alert("Got error here image not loading properly");
        }, t_2.src = src_right;
    }
    //_______________________________________________________________________________________
    //+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
    function deleteFromDB(id) {
        $http.post('http://seats.dlldevstudio.ddemo.ru/api/delete-seat?seatplan_id=' + $localStorage.information.seatplan_id + '&seat_id=' + id + '&auth_token=' + $localStorage.information.reauth_token).success(function (data) {
            // console.log('Success');
            return data;
        }).error(function (error) {
            console.log(error);
            alert(error);
            return error;
        });
    }
    $scope.trash = function () {
        if (canvas.getActiveGroup()) {
            var obj = canvas.getActiveGroup()._objects;

            var _loop = function _loop(i) {
                if (obj[i].type == 'group') {
                    if (obj[i]._objects[0].virtual) {
                        $scope.on_the_plan--;
                        canvas.remove(obj[i]);
                        canvas.renderAll();
                    } else if (obj[i]._objects[0]._type == "rect" || obj[i]._objects[0]._type == "circle") {
                        canvas.remove(obj[i]);
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
                                                seatCounters(obj[i]._objects[j].status, "free_seat");
                                                deleteFromDB(obj[i]._objects[j].id);
                                            }
                                            deleteFromDB(obj[i].id);
                                            canvas.remove(obj[i]);
                                        } else {
                                            $scope.on_the_plan--;
                                            for (var _j = 0; _j < obj[i]._objects.length; _j++) {}
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
            if (canvas.getActiveObject().type == 'group') {
                if (canvas.getActiveObject()._objects[0].virtual) {
                    $scope.on_the_plan--;
                    canvas.remove(canvas.getActiveObject());
                    canvas.renderAll();
                } else if (canvas.getActiveObject()._objects[0]._type == "rect" || canvas.getActiveObject()._objects[0]._type == "circle") {
                    canvas.remove(canvas.getActiveObject());
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
                                if (res) {
                                    if (canvas.getActiveObject()._objects[0].status != "free_seat") {
                                        $scope.on_the_plan--;
                                        for (var i = 0; i < canvas.getActiveObject()._objects.length; i++) {
                                            seatCounters(canvas.getActiveObject()._objects[i].status, "free_seat");
                                            deleteFromDB(canvas.getActiveObject()._objects[i].id);
                                        }
                                        deleteFromDB(canvas.getActiveObject().id);
                                        canvas.remove(canvas.getActiveObject());
                                    } else {
                                        $scope.on_the_plan--;
                                        for (var _i3 = 0; _i3 < canvas.getActiveObject()._objects.length; _i3++) {
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
    //___________________________
    //

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
                        $scope.show_controls = !$scope.show_controls;
                        $scope.setZoom($scope.seatplan.zoomlavel);
                        $scope.save();
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
        // console.clear();
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
    $scope.doExit = function () {
        $http.get('http://seats.dlldevstudio.ddemo.ru/api/logout').success(function (data) {
            console.log(data);
            delete $localStorage.information;
            $state.go('app.login');
        }).error(function (error) {
            // console.log(error);
            alert('Error logging out');
        });
    };
    $scope.exit = function () {
        if ($scope.changed) {
            var confirmExit = $ionicPopup.confirm({
                title: 'Action confirm',
                template: '<div class="card"><div class="item item-text-wrap text-center"><h1>Plan was changed. Do you want exit?</h1></div></div>'

            });
            confirmExit.then(function (res) {
                if (res) {
                    $scope.doExit();
                }
            });
        } else {
            $scope.doExit();
        }
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
        $scope.changed = false;
        var seats_in_canvas_status = [];
        var seats_in_canvas = {};
        var seats_to_umbrella_in_canvas = {};
        var rect_in_canvas = {};
        var circle_in_canvas = {};
        var text_in_canvas = {};
        var group_umbrella_in_canvas = {};
        // var group_in_canvas = {}
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
                            "twoSeats": canvas._objects[i]._objects[j].twoSeats
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
                "oneSeat": one_seat_array[_i4].oneSeat
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
                "twoSeats": two_seats_array[_i5].twoSeats
            };
        }
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
                if (data.statusText == "OK" && data.status == 200) {
                    $scope.showLoading(true);

                    $timeout(function () {
                        alertSavedSuccess();
                        $scope.reset2();
                        loadJSON();
                        $rootScope.$broadcast('loadJSONfromSeatPlane', false);
                        $scope.showLoading(false);
                    }, 1000);
                } else {
                    // console.log('Error');
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
                        mode: 'umbrella'
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
                        mode: 'seat',
                        place: rightSeat.place,
                        twoSeats: rightSeat.twoSeats
                    });
                    $scope.on_the_plan++;
                    $scope.on_the_plan++;
                    var fullWidth = (umbrella.width + left.width + right.width) / 1.5;
                    var fullHeight = (umbrella.height + left.height) / 2 * 1.2;
                    canvas.add(new fabric.Group([left, right, umbrella], {
                        height: fullHeight,
                        width: fullWidth,
                        top: umbrella_top,
                        left: umbrella_left,
                        scaleX: scaleX,
                        scaleY: scaleY
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
                        oneSeat: seat.oneSeat
                    }).setCoords(), canvas.add(new fabric.Group([img, umbrella], {
                        top: umbrella_top,
                        left: umbrella_left,
                        scaleX: scaleX,
                        scaleY: scaleY
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
    function loadJSON() {
        $scope.changed = false;
        console.log($localStorage.information);
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
    // _ load
    $rootScope.$on('loadJSONfromPosMode', function (event) {
        $scope.reset2();
        loadJSON();
    });
    //___________________________
}