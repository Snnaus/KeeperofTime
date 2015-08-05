'use strict';

angular.module('workspaceApp')
  .controller('ProjectCtrl', function ($scope, $routeParams, socket, Auth, $http, $location, $interval) {
    $scope.isLoggedIn = Auth.isLoggedIn();
    $scope.isAdmin = Auth.isAdmin();
    $scope.getCurrentUser = Auth.getCurrentUser();
    
    
    
    $scope.project = [];
    $scope.contrib = false;
    $scope.manage = false;
    $scope.preview = false;
    $scope.curTime = '';
    $scope.timerOn = false;
    $scope.totsTime = '';
    $scope.addUser = '';
    $scope.role = '';
    $http.post('/api/projects/user', { _id: $routeParams.id }).success(function(project){
      
      //These statements are checking to see of the current user is related to the
      //project; whether as a contributer or a manager.
      
      if(project[0].contributers.indexOf($scope.getCurrentUser._id) !== -1){
        $scope.contrib = true;
      } else if(project[0].managers.indexOf($scope.getCurrentUser._id) !== -1){
        $scope.manage = true;
      }else{
        project[0].invites.forEach(function(invite){
          if(invite.invited === $scope.getCurrentUser.email){
            $scope.preview = invite;
          }
        });
      }
      
      
      //This is the logic gate to stop unrelated users from viewing the content.
      if($scope.contrib || $scope.manage || $scope.preview){
        $scope.project = project;
        socket.syncUpdates('project', $scope.project, function(event, item, object){
          if(item.contributers.indexOf($scope.getCurrentUser._id) !== -1){
            $scope.contrib = true;
            $scope.preview = false;
          } else if(item.managers.indexOf($scope.getCurrentUser._id) !== -1){
            $scope.manage = true;
            $scope.preview = false;
          }
        });
        
        var timerCheck = project[0].timers.filter(function(timer){ return timer.user === $scope.getCurrentUser._id && timer.end === 'running'  });
        if(timerCheck.length > 0){
          $scope.timerOn = true;
        } else {
          $scope.totsTime = formatTime(addTotalTime(project[0].timers));
        }
        //console.log($scope.project, $scope.getCurrentUser);
      } else{
        $location.path('/dashboard');
      }
    });
    
    //This is the function that updates the projects message array, in order to have a realtime chat (sort of).
    $scope.newMsg = '';
    $scope.sendMsg = function(project, message, user){
      if(message){
        message = [user.name, message, Date.now(), user._id];
        project.messages.push(message);
        $http.put('/api/projects/'+project._id, { messages: project.messages });
        $('#msgArea').val('');
      }
    };
    
    //this creates a new timer array within the projects timers
    $scope.startTimer = function(project, user){
      var newTimer = {
        start: Date.now(),
        end: 'running',
        title: '',
        user: user._id,
        name: user.name
      };
      project.timers.push(newTimer);
      $http.put('/api/projects/'+project._id, { timers: project.timers, timerOn: true });
      $scope.timerOn = true;
    };
    
    //this stops the latest timer array
    $scope.pauseTimer = function(project){
      var index = -1;
      for(var i=project.timers.length-1 ;i>-1;i--){
        if(project.timers[i].user === $scope.getCurrentUser._id && project.timers[i].end === 'running'){
          index = i;
          break;
        }
      }
      
      project.timers[index].end = Date.now();
      var totalTimers = addTotalTime(project.timers);
      $http.put('/api/projects/'+project._id, { timers: project.timers, timerOn: false, totaltime: totalTimers });
      $scope.timerOn = false;
    };
    
    //if the current project has a timer on it will then count up and format the time;
    //used in the interval
    function timeCounter(){
      if($scope.timerOn){
        var index = -1;
        for(var i=$scope.project[0].timers.length-1 ;i>-1;i--){
          if($scope.project[0].timers[i].user === $scope.getCurrentUser._id && $scope.project[0].timers[i].end === 'running'){
            index = i;
            break;
          }
        }
        
        
        var currTime = (Number(Date.now()) - Number($scope.project[0].timers[index].start));
        var x = formatTime(currTime);
        $('#curTime').text("Current time is: " + x);
        
        var totTime = $scope.project[0].timers.reduce(function(agg, curr){
          if(curr.end === 'running'){
            curr.total = Date.now() - curr.start;
            return parseInt(agg) + parseInt(Date.now() - curr.start);
          } else{
            return parseInt(agg) + parseInt(curr.end - curr.start);
          }
        }, 0);
        $scope.totsTime = formatTime(totTime);
        
      }else if($scope.project[0].timers.filter(function(timer){ return timer.end === 'running' }).length > 0){
        var totTime2 = $scope.project[0].timers.reduce(function(agg, curr){
          if(curr.end === 'running'){
            curr.total = Date.now() - curr.start;
            return parseInt(agg) + parseInt(Date.now() - curr.start);
          } else{
            return parseInt(agg) + parseInt(curr.end - curr.start);
          }
        }, 0);
        $scope.totsTime = formatTime(totTime2);
      }
    }
    
    var timer = $interval(timeCounter, 250);
    $scope.$on('$destroy', function(){
      $interval.cancel(timer);
    });
    
    //takes millisecond and formats them to look good and readable.
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
    
    //Adds all the time that the timers has been on
    function addTotalTime(timers){
      //console.log(timers)
      var total = timers.reduce(function(agg, curr){
        if(curr.end !== 'running'){
          return agg + Number(curr.end) - Number(curr.start);
        } else{
          return agg;
        }
      }, 0);
      return total;
    }
    
    $scope.inviteUser = function(email, role, project){
      var check = project.invites.filter(function(invite){return invite.invited === email});
      var role_check = role === 'Contributer' || role === 'Manager';
      if(check.length < 1 && role_check){
        var inv = {
          invited: email,
          inviter: $scope.getCurrentUser.email,
          accepted: false,
          role: role
        };
        project.invites.push(inv);
        $http.put('/api/projects/'+project._id, { invites: project.invites });
        $('#invEmail').val('');
      }
    };
    
    //adds the user to one of the main lists before passing the invite on to be
    //deleted.
    $scope.acceptInv = function(invite, user, project){
      if(invite.role === 'Manager' || invite.role === 'manage'){
        project.managers.push(user._id);
        user.managing.push(project._id);
      } else if(invite.role === 'Contributer' || invite.role === 'contrib'){
        project.contributers.push(user._id);
        user.contributing.push(project._id);
      }
      updateConMan(project, invite, user);
    };
    
    //simply passes the porject and invite to the update function (to be deleted)
    //without adding them to either main array.
    $scope.declineInv = function(invite, project, user){
      updateConMan(project, invite, user);
    };
    
    //This function looks to delete the invite from the project and technically updates
    //the manager and contributer arrays.
    function updateConMan(project, invite, user){
      var index = -1;
      for(var i = 0; i<project.invites.length; i++){
        if(project.invites[i].invited === invite.invited){
          index = i;
        }
      }
      var garbage = project.invites.splice(index, 1);
      $http.put('/api/projects/'+project._id, { 
        managers: project.managers, 
        contributers: project.contributers,
        invites: project.invites
      });
      $http.post('/api/users/'+user._id, { managing: user.managing, contributing: user.contributing });
      //$location.path('/projects/'+project._id);
    }
    
    //This function is used to close a project; it should end the a timer if it is running;
    //it will set the project.active as false
    $scope.closeProject = function(project){
      var stopTime = Date.now();
      var result = window.confirm("Are you sure you want to close this Project?");
      if(result){
        $scope.timerOn = false;
        project.timers.forEach(function(timer){
          if(timer.end === 'running'){
            timer.end = stopTime;
          }
        });
        $http.put('/api/projects/'+project._id, { active: false, timers: project.timers, totaltime: addTotalTime(project.timers), timerOn: false });
      }
    };
    
    //this function is to format the comment post time to be readable
    $scope.formatCmtTime = function(time){
      var postTime = new Date(time);
      var months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
      var time2 = parseInt(postTime.getHours()) + ':' + parseInt(postTime.getMinutes()),
      date = "\t" + months[postTime.getMonth()] + " " + parseInt(postTime.getDate())+" ";
      
      return date + time2;
    };
    
    //this function is to remove a user from the contributing/manager array, removing him from the project
    $scope.leaveProj = function(project, user){
      var result = window.confirm("Are you sure you want to leave this Project?");
      if(result){
        //removing the user from the projects arrays
        var conIn = project.contributers.indexOf(user._id), manIn = project.managers.indexOf(user._id);
        if(conIn !== -1){
          var garbageCon = project.contributers.splice(conIn, 1);
        }
        if(manIn !== -1){
          var garbageMan = project.managers.splice(manIn, 1);
        }
        
        //Stopping any timers that the user has started
        project.timers.forEach(function(timer){
          if(timer.user === user._id && timer.end === 'running'){
           timer.end = Date.now(); 
          }
        });
        
        //removing the project from the users arrays
        if($scope.manage){
          var garbageManU = user.managing.splice(user.managing.indexOf(project._id),1);
        } else if($scope.contrib){
          var garbageConU = user.contributing.splice(user.contributing.indexOf(project._id),1);
        }
        
        $http.put('/api/projects/'+project._id, { contributers: project.contributers, managers: project.managers, timers: project.timers });
        $http.post('/api/users/'+user._id, { managing: user.managing, contributing: user.contributing });
        $location.path('/dashboard');
      }
    };
  });