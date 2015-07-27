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
    $scope.totsTime = '';
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
        } else{
          $scope.totsTime = formatTime(addTotalTime(project[0].timers));
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
        //$scope.timerOn = true;
        var newTimer = [Date.now(), 'running'];
        project.timers.push(newTimer);
        $http.put('/api/projects/'+project._id, { timers: project.timers, timerOn: true });
      }
    };
    
    $scope.pauseTimer = function(project){
      //$scope.timerOn = false;
      project.timers[project.timers.length - 1][1] = Date.now();
      var totalTimers = addTotalTime(project.timers);
      console.log(totalTimers);
      $http.put('/api/projects/'+project._id, { timers: project.timers, timerOn: false, totaltime: totalTimers });
    };
    
    function timeCounter(){
      if($scope.project[0].timerOn){
        //$scope.curTime = Number(Date.now()) - Number($scope.project[0].timers[$scope.project[0].timers.length - 1][0]);
        var currTime = (Number(Date.now()) - Number($scope.project[0].timers[$scope.project[0].timers.length - 1][0]))
        var x = formatTime(currTime), totTime = formatTime($scope.project[0].totaltime + currTime);
        
        $('#curTime').text("Current time is: " + x);
        $('#totTime').text(totTime);
      }
    }
    
    var timer = $interval(timeCounter, 250);
    $scope.$on('$destroy', function(){
      $interval.cancel(timer);
    });
    
    function formatTime(millis){
      millis = millis/1000;
      var seconds = parseInt(millis%60), minutes = parseInt(millis/60);
        if(seconds < 10){
          seconds = '0' + seconds.toString();
        }
        
        if(millis/60>60){
          var hours = parseInt(minutes/60).toString() + ':';
          if(minutes%60<10){
            minutes = '0' + parseInt(minutes%60).toString();
          }else{
            minutes = parseInt(minutes%60).toString();
          }
          minutes = hours + minutes;
        }
        return minutes.toString() + ":" + seconds.toString();
    }
    
    function addTotalTime(timers){
      //console.log(timers)
      var total = timers.reduce(function(agg, curr){
        if(curr[1] !== 'running'){
          return agg + Number(curr[1]) - Number(curr[0]);
        } else{
          return agg;
        }
      }, 0);
      return total;
    }
  });