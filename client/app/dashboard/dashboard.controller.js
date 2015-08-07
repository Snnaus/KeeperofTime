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
    $scope.projectView = true;
    $scope.manageView = false;
    $scope.invView = false;
    $scope.recentMsgs = [];
    
    $http.post('/api/projects/user', { contributers: $scope.getCurrentUser._id }).success(function(projects){
      $scope.projects = projects;
      $scope.recentMsgs = updateRecentMsgs(projects, $scope.recentMsgs);
      socket.syncUpdates('project', $scope.projects, function(event, item, object){
        //this removes the updated object if the current user is not a contributer
        if(item.contributers[0] !== $scope.getCurrentUser._id){
          var garbage = object.splice(-1, 1);
        }
        $scope.projects = object;
        $scope.recentMsgs = updateRecentMsgs(object, $scope.recentMsgs);
      });
    });
    $http.post('/api/projects/user', { managers: $scope.getCurrentUser._id }).success(function(projects){
      $scope.managing = projects;
      $scope.recentMsgs = updateRecentMsgs(projects, $scope.recentMsgs);
      socket.syncUpdates('project', $scope.managing, function(event, item, object){
        //this removes the updated object if the current user is not a manager
        if(item.managers[0] !== $scope.getCurrentUser._id){
          var garbage = object.splice(-1, 1);
        }
        $scope.managing = object;
        $scope.recentMsgs = updateRecentMsgs(object, $scope.recentMsgs);
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
      if(name){
        var newProj = {
          name: name,
          info: '',
          active: true,
          messages: [],
          messageOn: false,
          totaltime: 0,
          contributers: [user._id],
          managers: [],
          messages: [],
          invited: []
        };
        $http.post('/api/projects', newProj);
        $http.post('/api/projects/user', { contributers: user._id }).success(function(projects){
        var theOne = projects.filter(function(project){return user.contributing.indexOf(project._id) === -1});
        user.contributing.push(theOne[0]._id);
        $http.post('api/users/'+user._id, { contributing: user.contributing });
        $('#titleInp').val('');
        });
    }  
    };
    
    $scope.changeArea = function(area){
      $scope.projectView = false;
      $scope.manageView = false;
      $scope.invView = false;
      var allAreas = ['#project', '#manage', '#invites'];
      allAreas.forEach(function(item){
        $(item).removeClass('active');
      });
      
      if(area == 'project'){
        $scope.projectView = true;
        $("#project").addClass('active');
      } else if(area == 'manage'){
        $scope.manageView = true;
        $('#manage').addClass('active');
      } else{
        $scope.invView = true;
        $('#invites').addClass('active');
      }
    };
    
    var updateRecentMsgs = function(projects, msgs){
      
      var msgIDs = msgs.map(function(msg){ return msg.msgID });
      
      projects.forEach(function(project){
        project.messages.forEach(function(message){
          if(msgIDs.indexOf(message.msgID) === -1){
            msgs.push(message);
            msgIDs.push(message.msgID);
          }
        });
      });
      
      msgs = msgs.sort(function(a, b){
        return b.time - a.time;
      });
      if(msgs.length > 10){
        var garbage = msgs.splice(9, msgs.length-10);
      }
      
      return msgs;
    };
    
    //this function is to format the comment post time to be readable
    $scope.formatCmtTime = function(time){
      var postTime = new Date(time);
      var months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
      var time2 = parseInt(postTime.getHours()) + ':' + parseInt(postTime.getMinutes()),
      date = "\t" + months[postTime.getMonth()] + " " + parseInt(postTime.getDate())+" ";
      
      return date + time2;
    };
  });
