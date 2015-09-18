# suddenStats
minimal config common statistics

inteded for high volume streaming data

can use these stats to make very fast decisions in app logic, or display constantly changing values.

data can be fed to qData function as often as needed. it will buffer for specified batch time frames, and limit the batch in that timeframe to a defined limit.

the throttle time and buffer size are auto adjusting, but can be given values