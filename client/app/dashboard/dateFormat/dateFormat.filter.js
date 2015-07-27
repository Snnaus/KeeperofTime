'use strict';

angular.module('workspaceApp')
  .filter('dateFormat', function () {
    return function (input) {
      
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
    };
      
      var inputs = input.map(function(time){
        if(time === 'running'){
          return time;
        } else{
          var x = new Date(time), y = new Date();
          var month = x.getMonth(), date = x.getDate(), hour = x.getHours() + 1, minutes = x.getMinutes(), year = x.getFullYear();
          var months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
           
          var dateFront = months[month] + " " + date.toString();
          if(y.getFullYear() !== year){
            dateFront = dateFront + " " + year;
          }
          if(minutes < 10){
            minutes = '0'+minutes.toString();
          }
          var timeBack = "  " + hour.toString() + ':' + minutes.toString();
          
          return dateFront + timeBack;
        }
      });
      var totaltime = '';
      if(input[1] !== 'running'){
        totaltime = " || Total Time: " + formatTime(input[1] - input[0]);
      }
      return "Started: " + inputs[0] + " || Ended: " + inputs[1] + totaltime;  
    };
  });
