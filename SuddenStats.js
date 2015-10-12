'use strict';
// add stat, wipe stats, update stat
// stats windows
// limits on windows, limits on stats 

//Why? because stats like .min and .max need to be run over an entire array each time, these stay up to date. normally it's cheap to just dump into an array and run min and max etc when you need them, but in some cases min and max are neded to determine what to do often.

/* 
everything is optional!
objConfig={  
	 limit: 1000
	,stats:
		{
			 key:{
				 path:'path of key within an object'
				,type:'numeric, uniq, freq, co-occurence'
				,values:{starting values
			 }
		}
}

stat types:
  numeric=min,max,avg, etc.
  uniq=value,count (also with substring search support)
  compete=uniq+numeric (also with substring search support)
  co-occurence=2 coinciding values count (also with substring search support)

TODO: move vars to private-ish like default configs
compete
stat windows
window history
conditional config based on properties in passed in object, if it has this property, use this path etc.

*/
//var _ = require('lodash');
var SuddenStats = function(objConfig){
	//start with some defaults, the global stat will require nuothing but a number passed in an array.
	this.config = {limit:1000,throttle:1000,stats:{primary:{type:'numeric'}}};
	//simple mode is when only the global stat is used and only arrays of numbers are passed in. by setting this once for the object it avoids many typechecks
	this.simple = false;
	this.stats = {};
	this.batch = [];
	this.intBatch = 0;
	//this.processing = false;
	var objDefaults={},updateStats = {},aggStats={};
	 objDefaults.numeric = {min:0,max:0,avg:0,count:0,total:0,first:false,last:false,lastAvg:false,diff:0,fs:Date.now(),ls:Date.now(),type:'numeric'};
	 objDefaults.uniq = {limit:100,count:0,fs:Date.now(),ls:Date.now(),min:0,max:0,total:0,avg:0,values:{}};
	 objDefaults.compete = {limit:100,min:0,max:0,avg:0,count:0,total:0,first:false,last:false,lastAvg:false,diff:0,fs:Date.now(),ls:Date.now(),values:{}};;
	 objDefaults.co_occurence = {limit:100,count:0,fs:Date.now(),ls:Date.now(),values:{}};
	 objDefaults.windows = {minute:60,hour:24,day:7,week:52};


	//----====|| UTILITY FUNCTIONS ||====----\\
	//get a value from a defined path in an object
	var _get = function(objModel, strPath) {
        var arrProps = strPath.split('.'),
            prop = objModel;
        for(var i = 0, len = arrProps.length; i < len; i++) {
            if (typeof prop[arrProps[i]] !== 'undefined' && prop[arrProps[i]] !== null) { prop = prop[arrProps[i]];} 
            else { return null;}
        }
        return prop;
    };
    //for each property in an object
    var _forOwn = function(obj,fn){ _forEach(Object.keys(obj),function(v,k){ fn(obj[v],v); }); };
    //trick forEach
    var _forEach = function(arr,fn){
    	var v,i=0;
    	while(v=arr.pop()){ 
    		fn(v,i); 
    		i++;
    	}
    };
    var _for = function(arr,fn){ for(var i=arr.length-1;i>=0;i--){ fn(arr[i],i); } }
    var _defaults = function(objTarget,objDefaults){
    	_forOwn(objDefaults,function(v,k){ 
    		if(!objTarget[k]){ objTarget[k]= v;}
    		else if(typeof objTarget[k]==='object' && typeof objDefaults ==='object'){ _defaults(objTarget[k],objDefaults[k]); }
    	});
    	//console.log(objTarget,objDefaults);
    	return objTarget;
    };
    var _filterOld = function(arrData,strPath,intValue){
		var arrFresh=[];
    	_forEach(arrData,function(v,k){
    		if(_get(v,strPath) > intValue){ arrFresh.push(v); }
    	});
    	return arrFresh;
    }
    //----====|| END UTILITY FUNCTIONS ||====----\\

	var self=this;
	var init = function(objConfig){
		//TODO: validate the structure of config passed in
		//simple mode is only for when there are just arrays of numbers sent, if it's objects cant use simple mode
		if(objConfig && objConfig.stats){ self.config.stats={}; }
		//merge defaults and config provided.
		if(typeof objConfig==='object'){self.config = _defaults(self.config,objConfig);}
		//console.log(self.config);
		//create all of the stats properties for what will be tracked
		_forOwn(self.config.stats,function(objStat,k){
			//console.log(objV,k);
			//set defaults for stat
			//add any user overrides to things like type
			self.stats[k] = _defaults(objStat,objDefaults[objStat.type]);
			//init the windows
			if(objStat.hasOwnProperty('level') && objDefaults.windows.hasOwnProperty(objStat.level)){ 
				self.stats[k].windows={ts_minute:false};
				self.stats[k].windows.current = _defaults({},objDefaults[objStat.type]);
				self.stats[k].windows.minute=[];
				if(self.config.stats[k].level=='hour' || self.config.stats[k].level=='day'){ 
					self.stats[k].windows.ts_hour=false;
					self.stats[k].windows.hour=[]; 
				}
				if(self.config.stats[k].level=='day'){
					self.stats[k].windows.ts_day=false;
					self.stats[k].windows.day=[]; 
				}
			}
		});
		//can we go into simple mode? if so it will be much faster, and generic of course
		if(self.stats.primary){ self.simple = true; }
	}

	init(objConfig);

	this.qData = function(varData){
		//EXAMPLE: objStat.qData([1,2,3,4]);
		//add data as often as you want, but batch it by time, using the deboucne config, defined in miliseconds
		//config.limit is to start kciking things out of the batch after too many per batch / time period
		
			if(Array.isArray(varData)){  
				//combine batches or arrays into the throttle timeline
				var v;
				self.intBatch=self.intBatch = self.intBatch+varData.length;
				while(v=varData.pop()){ self.batch.push(v); }
			}else{
				//for individual entries
				self.intBatch=self.intBatch+1;
				self.batch.push(varData);
			}
			/* 
			if(fnInprocess){ 
				if(self.config.limit > 2){self.config.limit--;} 
				self.config.throttle++;
			}
			*/
		if(self.intBatch>=self.config.limit){ this.addData(self.batch); }
		//this.runQ(self.batch);
	};

	this.addData = function(arrData){
		//EXAMPLE: objStat.addData([1,2,3,4]);
		//always work with an array of data. Data is expected be in such vlume that it should be buffered into batches
		if(arrData.length===0 && self.batch.length>0){arrData=self.batch;}
		//clear the batch
		self.batch=[]; self.intBatch=0;
		if(self.simple===true){ self.stats.primary = updateStats['numeric'](arrData,self.stats.primary); }
		else{
			var arrBatch={};
			_forOwn(self.config.stats,function(objStat,strStat){
				//init the batch so all we have to do is push.
				arrBatch[strStat]={data:[]};
			});
			//----====|| LOOP THROUGH DATA GIVEN, CREATE STAT BATCHES ||====----\\
			_forEach(arrData,function(objData,k){
				//----====|| LOOP THROUGH STATS CONFIG ||====----\\
				_forOwn(self.config.stats,function(objStat,strStat){
					var varValue =false;
					switch(objStat.type){
						case 'numeric': varValue = _get(objData,objStat.path); break;
						case 'uniq': varValue = _get(objData,objStat.path); break;
						case 'compete': varValue = [_get(objData,objStat.path),_get(objData,objStat.score)]; break;
						case 'co_occurence': varValue= _get(objData,objStat.path)+'_'+_get(objData,objStat.path2); break;
					}
					//get the numbers from the object based on the path
					if(varValue !== false){ arrBatch[strStat].data.push( varValue ); }else{ console.log('value not found', strStat, objStat, objStat.path , objData); }
				});
			});
			//----====|| PROCESS STATS BATCHES ||====----\\
			_forOwn(arrBatch,function(objStat,strStat){
				//console.log(strStat,objStat,self.stats[strStat].type,self.config.stats[strStat].type);
				self.stats[strStat]=updateStats[self.config.stats[strStat].type](objStat.data,self.stats[strStat]);
				//----====|| STATS WINDOWS ||====----\\
				//is a window defined for the stat?
				if(self.stats[strStat].hasOwnProperty('level')){
					self.stats[strStat]=updateWindows(objStat.data,self.stats[strStat]); 
				}
				//console.log(arrBatch);
				arrBatch[strStat] = {};
			});
		}
	};

	var updateWindows = function(arrData, objStat){
		//console.log(arrData,objStat);
		//does a new bucket need to be created?
		var intNow=Date.now();
		if(objStat.windows.current.fs < intNow/60000 ){
			//take current bucket, snapshot it to history
			objStat.windows.minute.push(objStat.windows.current);
			//re-init current bucket
			objStat.windows.current = _defaults({},objDefaults[objStat.type]);
			if(objStat.windows.hasOwnProperty('hour') && objStat.windows.ts_hour < intNow-360000){
				//loop through minutes and drop off anything older than an hour
				objStat.windows.minute = _filterOld(objStat.windows.minute, 'fs', 360000)
				//then take the remaining ones to aggregate into an hour
				objStat.windows.hour.push( aggStats[objStat.type](objStat.windows.minute) );
				objStat.windows.ts_hour = intNow;
			}
			if(objStat.windows.hasOwnProperty('day') && objStat.windows.ts_hour < intNow-86400000){
				//loop through minutes and drop off anything older than an hour
				objStat.windows.hour = _filterOld(objStat.windows.hour, 'fs', 86400000)
				//then take the remaining ones to aggregate into an hour
				objStat.windows.day.push( aggStats[objStat.type](objStat.windows.hour) );
				objStat.windows.ts_day = intNow;
			}			
		}
		//process current
		objStat.windows.current = updateStats[objStat.type](arrData,objStat.windows.current);
		return objStat;
	}

	updateStats.uniq = function(arrData, objStat){
		//console.log(arrData,key);
		var intTotal=1, intCount=1,
			v;
		while(v=arrData.pop()){
			if(objStat.values.hasOwnProperty(v)){ objStat.values[v]++; }
			else{objStat.values[v]=1; intCount++; }
			intTotal = ((intTotal | 1) + 1) | 1;
		}
		objStat.total += intTotal;
		objStat.count = intCount;
		return objStat;
	}

	updateStats.compete = function(arrData, objStat){
		var intCount = 1,
			v;
		while(v=arrData.pop()){
			if(objStat.values.hasOwnProperty(v)){ objStat.values[v]++; }
			else{objStat.values[v]=self.objCompeteDefaults;}
			intCount = ((intCount | 1) + 1) | 1;
		}
		objStat.count += intCount;
		//TODO: add the numeric stats for score
		return objStat;
	}

	updateStats.co_occurence = updateStats.uniq;

	updateStats.numeric = function(arrData, objStat){
		if (!(arrData instanceof Array)) { arrData = [arrData]; }
		//EXAMPLE: objStat.updateStat([1,2,3,3,4],'primary');
		//console.log(this.stats);
		var intCount = 0,
			intMin=arrData[0],
			intMax=0,
			intSum=0,
			intTotal=0,
			intFirst=arrData[0],
			intLast=arrData[0];
		_for(arrData,function(v,k){
			if(v<intMin){ intMin=v; }
			if(v>intMax){ intMax=v; }
			intSum += v;
			intFirst = v;
			intCount++;
		});
		var intAvg = intSum/intCount;
		if( intMin < objStat.min || objStat.first===false ){ objStat.min = intMin; }
		if( intMax > objStat.max ){ objStat.max = intMax; }
		objStat.count = objStat.count + intCount;
		objStat.total += intSum;
		
		objStat.last = intLast;
		if( objStat.first===false ){ objStat.first = intFirst; objStat.fs=Date.now(); }
		objStat.ls=Date.now();
		objStat.avg=objStat.total/objStat.count;
		objStat.diff = intAvg-objStat.lastAvg;
		objStat.lastAvg = intAvg;
		return objStat;
	};
	
	aggStats.numeric = function(arrData){
		var objAgg = _defaults({},objDefaults.numeric);
		_forEach(arrData,function(v,k){
			if(v.min < objAgg.min){ objAgg.min = v.min; }
			if(v.max > objAgg.max){ objAgg.max = v.max; }
			if(v.fs < objAgg.fs){ objAgg.fs = v.fs; }
			if(v.ls > objAgg.ls){ objAgg.max = v.ls; }
			objAgg.total += v.total;
			objAgg.count += v.count;
		});
		objAgg.avg = objAgg.total/objAgg.count;
		return objAgg;
	}
	aggStats.uniq = function(arrData){
		var objAgg = _defaults({},objDefaults.uniq);
		var intCount=0;
		_forEach(arrData,function(v,k){
			//get top level stats
			if(v.fs < objAgg.fs){ objAgg.fs = v.fs; }
			if(v.ls > objAgg.ls){ objAgg.max = v.ls; }
			objAgg.total += v.total;
			_for(v.values,function(vv,kk){
				if(objAgg.values.hasOwnproperty(kk)){ objAgg.values[kk] += vv; }
				else{ objAgg.values[kk] = vv; intCount++; }
			});
			objAgg.count = intCount;
		});
		return objAgg;
	}
	aggStats.compete = aggStats.uniq;
	aggStats.co_occurence = aggStats.uniq;
};
module.exports = SuddenStats;