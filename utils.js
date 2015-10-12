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
     self.filterOld = function(arrData,strPath,intValue){
		var arrFresh=[];
    	self.forEach(arrData,function(v,k){
    		if(self.get(v,strPath) > intValue){ arrFresh.push(v); }
    	});
    	return arrFresh;
    }
    //----====|| END UTILITY FUNCTIONS ||====----\\
}
module.exports = utils;