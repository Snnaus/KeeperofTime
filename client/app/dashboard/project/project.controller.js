'use strict';

angular.module('workspaceApp')
  .controller('ProjectCtrl', function ($scope, $routeParams, socket, Auth, $http, $location) {
    $scope.isLoggedIn = Auth.isLoggedIn();
    $scope.isAdmin = Auth.isAdmin();
    $scope.getCurrentUser = Auth.getCurrentUser();
    
    if(!$scope.isLoggedIn){
      $location.path('/login');
    }
    
    $scope.project = [];
    $scope.contrib = false;
    $scope.manage = false;
    $http.post('/api/projects/user', { _id:$routeParams.id }).success(function(project){
      
      //These statements are checking to see of the current user is related to the
      //project; whether as a contributer or a manager.
      
      if(project[0].contributers.indexOf($scope.getCurrentUser._id) !== -1){
        $scope.contrib = true;
      } else if(project[0].managers.indexOf($scope.getCurrentUser._id) !== -1){
        $scope.manage = true;
      }
      
      
      //This is the logic gate to stop unrelated users from viewing the content.
      if($scope.contrib || $scope.manage){
        $scope.project = project;
        socket.syncUpdates('project', $scope.project);
        //socket.syncUpdates('project', $scope.project[0].messages);
        console.log(project);
      } else{
        $location.path('/dashboard');
      }
    });
    
    $scope.newMsg = '';
    $scope.sendMsg = function(project, message){
      if(message){
        project.messages.push(message);
        $http.put('/api/projects/'+project._id, { messages: project.messages });
        $('#msgArea').val('');
      }
    };
  });