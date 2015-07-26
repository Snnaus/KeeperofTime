'use strict';

angular.module('workspaceApp')
  .config(function ($routeProvider) {
    $routeProvider
      .when('/project/:id', {
        templateUrl: 'app/dashboard/project/project.html',
        controller: 'ProjectCtrl'
      });
  });
