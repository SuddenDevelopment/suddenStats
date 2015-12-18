var utils = function(){
	var self=this;
	//----====|| UTILITY FUNCTIONS ||====----\\
	//get a value from a defined path in an object
	 self.get = function(objModel, strPath) {
        var arrProps = strPath.split('.'),
            prop = objModel;
        for(var i = 0, len = arrProps.length; i < len; i++) {
            if (typeof prop[arrProps[i]] !== 'undefined' && prop[arrProps[i]] !== null) { prop = prop[arrProps[i]];} 
            else { return null;}
        }
        return prop;
    };
    //for each property in an object
     self.forOwn = function(obj,fn){ self.forEach(Object.keys(obj),function(v,k){ fn(obj[v],v); }); };
    //trick forEach
     self.forEach = function(arr,fn){
    	var v,i=0;
    	while(v=arr.pop()){ 
    		fn(v,i); 
    		i++;
    	}
    };
     self.for = function(arr,fn){ for(var i=arr.length-1;i>=0;i--){ fn(arr[i],i); } }
     self.defaults = function(objTarget,objDefaults){
    	self.forOwn(objDefaults,function(v,k){ 
    		if(!objTarget[k]){ objTarget[k]= v;}
    		else if(typeof objTarget[k]==='object' && typeof objDefaults ==='object'){ self.defaults(objTarget[k],objDefaults[k]); }
    	});
    	//console.log(objTarget,objDefaults);
    	return objTarget;
    };
     //return an array of all keys full dpeth recursion
     self.deepKeys = function(objData){
        var arrKeys = [];
        self.forOwn(objData,function(v,k){
            if(typeof v ==='object'){ 
                self.forEach(self.deepKeys(v),function(vv,kk){
                    arrKeys.push(k+'.'+vv);
                }); 
            }
            else{ arrKeys.push(k); }
        });
        return arrKeys;
     };
     self.filterOld = function(arrData,strPath,intValue){
		var arrFresh=[];
    	self.forEach(arrData,function(v,k){
    		if(self.get(v,strPath) > intValue){ arrFresh.push(v); }
    	});
    	return arrFresh;
    };
    //----====|| STRINGS ||====----\\
    self.strCount = function(strNeedle,strHaystack,objOptions){
        if(objOptions && typeof objOptions.preserveCase!== 'undefined' && objOptions.preserveCase === false){ 
            strNeedle = strNeedle.toLowerCase(); strHaystack = strHaystack.toLowerCase; 
        }
        var arrMatch = strHaystack.split(strNeedle);
        return arrMatch.length-1;
    };
    self.strCounts = function(arrNeedles,strHaystack,objOptions){
        var objResults = {};
        _.for(arrNeedles,function(v,k){
            objResults[v] = self.strCount(v,strHaystack,objOptions);
        });
        return objResults;
    }
    //----====|| END UTILITY FUNCTIONS ||====----\\
}
if (typeof module !== 'undefined' && module.exports){module.exports = utils;}