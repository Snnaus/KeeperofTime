'use strict';

angular.module('workspaceApp')
  .controller('DashboardCtrl', function ($scope, Auth, $location, $http, socket) {
    $scope.isLoggedIn = Auth.isLoggedIn;
    $scope.isAdmin = Auth.isAdmin;
    $scope.getCurrentUser = Auth.getCurrentUser;
    
    if(!$scope.isLoggedIn){
      $location.path('/');
    }
    
    $scope.projects = [];
    $scope.managing = [];
    if($scope.getCurrentUser.contributing.length > 0){
      $scope.getCurrentUser.contributing.forEach(function(item){
        $http.get('/projects/'+item).success(function(data){
          $scope.projects.push(data);
        });
      });
      socket.syncUpdates('project', $scope.projects);
    }
    
    if($scope.getCurrentUser.managing.length > 0){
      $scope.getCurrentUser.managing.forEach(function(item){
        $http.get('/projects/'+item).success(function(data){
          $scope.managing.push(data);
        });
      });
      socket.syncUpdates('project', $scope.managing);
    }
  });
