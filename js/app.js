var hexArcadeApp = angular.module('hexArcadeApp', ['angular-loading-bar', 'ngRoute', 'ui.bootstrap', 'countTo', 'cgPrompt', 'angular-intro']);

/*Routing*/
hexArcadeApp.config(['$routeProvider', '$locationProvider',
    function ($routeProvider, $locationProvider) {
        $locationProvider.hashPrefix('');


        $routeProvider.
            when('/game_one', {
                templateUrl: './tpls/game_one.html',
                controller: 'gameOneCtrl as gameOne',
            }).
            when('/imprint', {
                templateUrl: './tpls/imprint.html',
            }).
            when('/data-protection', {
                templateUrl: './tpls/data-protection.html',
            }).
            otherwise({
                redirectTo: '/game_one'
            });
    }
]);
