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
    $scope.invited = [];
    $http.post('/api/projects/user', { contributers: $scope.getCurrentUser._id }).success(function(projects){
      $scope.projects = projects;
      socket.syncUpdates('project', $scope.projects, function(event, item, object){
        //this removes the updated object if the current user is not a contributer
        if(item.contributers[0] !== $scope.getCurrentUser._id){
          var garbage = object.splice(-1, 1);
        }
        $scope.projects = object;
      });
    });
    $http.post('/api/projects/user', { managers: $scope.getCurrentUser._id }).success(function(projects){
      $scope.managing = projects;
      socket.syncUpdates('project', $scope.managing, function(event, item, object){
        //this removes the updated object if the current user is not a manager
        if(item.managers[0] !== $scope.getCurrentUser._id){
          var garbage = object.splice(-1, 1);
        }
        $scope.managing = object;
      });
    });
    $http.post('/api/projects/user', { 'invites.invited': $scope.getCurrentUser.email }).success(function(projects){
      $scope.invited = projects;
      socket.syncUpdates('project', $scope.invited, function(event, item, object){
        //this will remove the updated object is the current user is not invited to see it
        var invited = false;
        item.invites.forEach(function(inv){
          //this is looking at all the invited users and determining if the current user is actually invited
          if(inv.invited === $scope.getCurrentUser.email){
            invited = true;
          }
        })
        if(!invited){
          var garbage = object.splice(-1, 1);
        }
        
        $scope.invited = object;
      });
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
        messages: [],
        invited: []
      };
      $http.post('/api/projects', newProj);
    };
  });
