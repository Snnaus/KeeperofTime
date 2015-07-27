'use strict';

angular.module('workspaceApp')
  .controller('DashboardCtrl', function ($scope, Auth, $location, $http, socket) {
    $scope.isLoggedIn = Auth.isLoggedIn();
    $scope.isAdmin = Auth.isAdmin();
    $scope.getCurrentUser = Auth.getCurrentUser();
    
    
    
    if(!$scope.isLoggedIn){
      $location.path('/login');
    }
    
    $scope.newTitle = '';
    $scope.projects = [];
    $scope.managing = [];
    $http.post('/api/projects/user', { contributers: [$scope.getCurrentUser._id] }).success(function(projects){
      $scope.projects = projects;
      socket.syncUpdates('project', $scope.projects);
    });
    $http.post('/api/projects/user', { managers: [$scope.getCurrentUser._id] }).success(function(projects){
      $scope.managing = projects;
    });
    
    $scope.createProj = function(name, user){
      var newProj = {
        name: name,
        info: '',
        active: true,
        timers: [],
        timerOn: false,
        totaltime: 0,
        contributers: [user._id],
        managers: [],
        messages: []
      };
      $http.post('/api/projects', newProj);
    };
  });
