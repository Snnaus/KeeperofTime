'use strict';

angular.module('workspaceApp')
  .filter('dateFormat', function () {
    return function (input) {
      input = input.map(function(time){
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
      return "Started: " + input[0] + " || Ended: " + input[1];  
    };
  });
