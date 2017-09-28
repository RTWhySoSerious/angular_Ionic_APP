'use strict';

// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.controllers' is found in controllers.js
var app = angular.module('starter', ['ui.router', 'ionic', 'ionic-material', 'pascalprecht.translate', 'starter.controllers', 'starter.services', 'ngStorage', 'ngCordova']).run(function ($ionicPlatform, AuthService, GetINFOService, $state, $localStorage, $localstorage) {
    $ionicPlatform.ready(function () {
        AuthService.userIsLoggedIn().then(function (data) {
            if (data == true) {
                $state.go('app.seatplan');
                $state.go('app.settings');
                
            } else if (data == false) {
                alert('No data in Auth Ctrl');
                $state.go('app.login');
            }else{
                alert('Undefined error in auth ctrl');
            }
        });

        if (window.cordova && window.cordova.plugins.Keyboard) {
            cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
            cordova.plugins.Keyboard.disableScroll(true);
        }
        if (window.StatusBar) {
            StatusBar.styleDefault();
        }
    });
}).config(function ($translateProvider, $stateProvider, $urlRouterProvider) {
    $translateProvider.translations('en', {
        seatPlanMode: 'Seat-Plan Mode',
        PosMode: 'POS-Mode',
        seatTowerMode: 'Seat-Tower Mode',
        seatStatus: 'SeatStatus',
        settings: 'Settings',
        menu: 'Menu',
        Save: 'Save',
        Undo: 'Undo',
        Exit: 'Exit',
        Book: 'Book',
        ChangeStatus: 'CHANGE STATUS',
        Cancel: 'Cancel',
        Load: 'Load'
    });
    $translateProvider.translations('fr', {
        seatPlanMode: 'Modo plan del asiento',
        PosMode: 'Modo plan del asiento',
        seatTowerMode: 'Modo de torre de asiento',
        seatStatus: 'SiègeStatus',
        settings: 'Réglage',
        menu: 'Menu',
        Save: 'SAUVEGARDER',
        Undo: 'ANNULER',
        Exit: 'SORTIE',
        Book: 'Livre',
        ChangeStatus: 'ChangeStatus',
        Cancel: 'Annuler',
        Load: 'Load'
    });

    var $localstorage = {
        getObject: function getObject(key) {
            try {
                return JSON.parse(window.localStorage[key] || '{}');
            } catch (error) {
                return JSON.parse('{}');
            }
        }
    };

    var lang = $localstorage.getObject('settings').lang;

    if (lang != "undefined") {
        $translateProvider.preferredLanguage(lang);
    } else {
        $translateProvider.preferredLanguage('en');
    }

    $stateProvider.state('app', {
        url: '/app',
        abstract: true,
        templateUrl: 'templates/menu.html',
        controller: 'AppCtrl'
    }).state('app.seatplan', {
        url: '/seatplan',
        views: {
            'menuContent': {
                templateUrl: 'templates/seatplan.html',
                controller: 'seatplanCtrl'
            }
        }
    }).state('app.posMode', {
        url: '/posmode',
        views: {
            'menuContent': {
                templateUrl: 'templates/posmode.html',
                controller: 'posModeCtrl'
            }
        }
    }).state('app.seat', {
        url: '/change-status-of-seat',
        views: {
            'menuContent': {
                templateUrl: 'templates/change-seat-status.html',
                controller: 'seatstatusCtrl'
            }
        }
    }).state('app.seattower', {
        url: '/seattower',
        views: {
            'menuContent': {
                templateUrl: 'templates/seattower.html',
                controller: 'seattowerCtrl'
            }
        }
    }).state('app.settings', {
        url: '/settings',
        views: {
            'menuContent': {
                templateUrl: 'templates/settings.html',
                controller: 'settingCtrl'
            }
        }
    }).state('app.login', {
        url: '/login',
        views: {
            'menuContent': {
                templateUrl: 'templates/login.html',
                controller: 'LoginCtrl'
            }
        }
    });

    $urlRouterProvider.otherwise('/app.login');
});