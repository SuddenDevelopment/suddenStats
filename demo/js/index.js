/* use strict */
/*jshint laxcomma: true */
var strSource='stream.wikimedia.org/rc';
var app = angular.module('CardUI', ['ngPrettyJson']);
var socket={};
var objStats = new SuddenStats({
		stats:{ 
			ips:{type:"uniq",path:"user",limit:50,padding:20,filter:[{path:"server_name",op:"ne",val:"en.wikipedia.org"},{path:"user",op:"in",val:"."}]}
			,type:{type:"uniq",path:"type",keep:"newHigh",limit:50,level:'hour'}
			,server:{type:"uniq",path:"server_name"}
		}
	});

app.controller('FUI',function($scope){
	$scope.config = {
		itemLimit:20
	};
	$scope.arrData=[]; 
	$scope.stats=objStats.stats;

	$scope.play=false;
	
	

	$scope.togglePlay=function(){
		if($scope.play===true){ socket.socket.disconnect(); }
		else{ socket.socket.reconnect(); }
	} 

	var fnPlay = function(strSource){
		socket = io.connect(strSource);
		socket.on('disconnect', function() { $scope.play=false; });
		socket.on('connect', function() { 
			socket.emit('subscribe', '*'); 
			$scope.play=true;
		});
		//add subscriptions to channels, handle the events
		socket.on('change', function(objData) { addEvent(objData); });
	}	

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
	fnPlay(strSource);
});
