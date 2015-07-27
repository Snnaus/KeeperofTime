'use strict';

angular.module('workspaceApp')
  .controller('ProjectCtrl', function ($scope, $routeParams, socket, Auth, $http, $location, $interval) {
    $scope.isLoggedIn = Auth.isLoggedIn();
    $scope.isAdmin = Auth.isAdmin();
    $scope.getCurrentUser = Auth.getCurrentUser();
    
    if(!$scope.isLoggedIn){
      $location.path('/login');
    }
    
    $scope.project = [];
    $scope.contrib = false;
    $scope.manage = false;
    $scope.curTime = '';
    $scope.timerOn = false;
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
        if(project[0].timers.length > 0 && project[0].timers[project[0].timers.length - 1][1] === 'running'){
          $scope.timerOn = true;
        }
        console.log($scope.project);
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
    
    
    $scope.startTimer = function(project){
      var gateKey = false;
      if(project.timers.length < 1){
        gateKey = true;
      } else {
        if(project.timers[project.timers.length - 1][1] !== 'running'){
          gateKey = true;
        }
      }
      if(gateKey){
        $scope.timerOn = true;
        var newTimer = [Date.now(), 'running'];
        project.timers.push(newTimer);
        $http.put('/api/projects/'+project._id, { timers: project.timers });
      }
    };
    
    $scope.pauseTimer = function(project){
      $scope.timerOn = false;
      project.timers[project.timers.length - 1][1] = Date.now();
      $http.put('/api/projects/'+project._id, { timers: project.timers });
    };
    
    function timeCounter(){
      console.log($scope.project[0].timerOn);
      if($scope.timerOn){
        //$scope.curTime = Number(Date.now()) - Number($scope.project[0].timers[$scope.project[0].timers.length - 1][0]);
        var x = Number(Date.now()) - Number($scope.project[0].timers[$scope.project[0].timers.length - 1][0]);
        $('#curTime').text("Current time is: " + x.toString());
        
      }
    };
    
    var timer = $interval(timeCounter, 250);
    $scope.$on('$destroy', function(){
      $interval.cancel(timer);
    });
  });