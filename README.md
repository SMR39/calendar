# calendar

setup git: 
```
sudo apt-get install git
mkdir calendar
cd calendar
git init
git config --global user.name "name"
git config --global user.email "email"
git clone https://github.com/SMR39/calendar.git
```
install npm:
```
sudo apt-get install npm
sudo apt-get install nodejs-legacy
sudo apt-get install mongodb
sudo nano /etc/hosts
sudo mkdir ~/data/
sudo mkdir ~/data/db/
mongod --smallfiles --dbpath ~/data/db/ &
npm start &
```
fill database:
```
curl -H "Accept: application/json" http://karma:8080/events
curl -H "Content-Type: application/json" -X POST -d '{"description":"Awesome party at Los place","location":"JMT1", "name":"Los party", "starttime":"2014-01-22T14:56:59.301Z"}' http://karma:8080/events
curl -H "Content-Type: application/json" -X POST -d '{"description":"Awesome party at Shashis place","location":"JMT3", "name":"Shashis party", "starttime":"2014-01-28T14:56:59.301Z"}' http://karma:8080/events
curl -H "Content-Type: application/json" -X PUT -d '{"description":"Awesome party at Los place","location":"JMT1", "name":"Los party", "starttime":"2014-01-22T14:56:59.301Z", "endtime":"2014-01-22T21:56:59.301Z"}' http://karma:8080/events
curl -H "Content-Type: application/json" -X GET -d '{"endtime":"2014-01-22T21:56:59.301Z"}' http://karma:8080/events
curl -H "Content-Type: application/json" -X DELETE http://karma:8080/events/562204a0ac3406ca40e0fc77/edit
curl -H "Content-Type: application/json" -X GET -d '{"minstarttime":"2014-01-20T21:56:59.301Z","maxstarttime":"2014-01-24T21:56:59.301Z"}' http://karma:8080/events/search
curl http://karma:8080/events/new
curl -H "Accept: application/json" -H "Content-Type: application/json" -X GET -d '{"minstarttime":"2014-01-20T21:56:59.301Z","maxstarttime":"2014-01-24T21:56:59.301Z"}' http://karma:8080/events/search/2014-01-22T14:54:59.301Z
```
Install Google APIs
```
npm install googleapis --save
npm install google-auth-library --save
```
Use iOS app:
- Open the XCode project file in XCode
- Build app for device or simulator with access to the Internet and running server
- Create new event by tapping +
- Edit event by tapping event, tapping field to edit, enter new value and go back
- Delete event by swiping the event to the left and press delete
- Weekly/monthly/all events could be shown
