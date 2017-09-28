'use strict';

settingCtrl.$inject = ['$scope', '$translate', '$localstorage'];
function settingCtrl($scope, $translate, $localstorage) {
    $scope.ChangeLanguage = function (lang) {
        $translate.use(lang);
        $localstorage.setObject('settings', { lang: lang });
    };
}