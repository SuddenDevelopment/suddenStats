/* use strict */
/*jshint laxcomma: true */

var app = angular.module('CardUI', ['ngPrettyJson']);

var objStats = new SuddenStats({
		stats:{ 
			ips:{type:"uniq",path:"user",limit:100,keep:"newHigh",filter:{path:"user",op:"in",val:"."}}
			,type:{type:"uniq",path:"type",limit:100,level:'minute'}
			,server:{type:"uniq",path:"server_name"}
		}
	});

app.controller('FUI',function($scope){
	$scope.config = {
		itemLimit:20
	};
	$scope.arrData=[]; 
	$scope.stats=objStats.stats;

	//connect to wikipedia
	var socket = io.connect('stream.wikimedia.org/rc');

	socket.on('connect', function() { socket.emit('subscribe', '*'); });

	//add subscriptions to channels, handle the events
	 socket.on('change', function(objData) { addEvent(objData); });

	var addEvent = function(objData){
		$scope.arrData.push(objData);
		objStats.qData(objData);
		//if(objStats.stats.type.values.hasOwnProperty('edit'))console.log(objStats.stats);
		var length = $scope.arrData.length;
		while (length-- > $scope.config.itemLimit) $scope.arrData.shift();
		//console.log($scope.stats.type.values);
		/* TODO: debounce the apply */
		$scope.$evalAsync();
	}
});
