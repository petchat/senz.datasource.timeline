FORMAT: 1A
Host: https://leancloud.cn/1.1/functions/

# Senz Data Process Service

***senz data process service*** provide a restful API for :

- ***Binding*** senz with several different raw data.

- and ***Extracting*** behaviors from different users.


## Binding Senz with several different raw data [/senz/]
You can invoke this method to bind all raw data which are unbind.
And you should specify the data is training set or not by ***is_training***.

isTraining:
- 1 : is training sample.
- 0 : is not training sample.

### Bind senz with raw data [POST]
+ Request (application/json)

    + Header

            X-AVOSCloud-Application-Id  : pin72fr1iaxb7sus6newp250a4pl2n5i36032ubrck4bej81,
            X-AVOSCloud-Application-Key : qs4o5iiywp86eznvok4tmhul360jczk7y67qj0ywbcq35iia

    + Body

            {
            "isTraining": 1 or 0
            }
        
+ Response 201 (application/json)

        {
        "result":{
            "code":0,
            "result":[
                "553f0100e4b0467125cc9c70",
                "553f19ece4b0467125d03226",
                "553f1acbe4b0467125d04d95",
                "555c2f9ee4b044c3499b11d3",
                "555c2fa4e4b044c3499b1203",
                "555c2fabe4b044c3499b122f",
                "555d8a08e4b0b8cc433f6c09",
                "5559863be4b0137a4e33a68c",
                "555c2efee4b044c3499b0d51",
                "555c2f04e4b044c3499b0d7e",
                "555c2f08e4b044c3499b0d95",
                "555c2f0be4b044c3499b0dc0",
                "555c2f0fe4b044c3499b0de0",
                "counterfeitObjectId",
                "5559880ce4b0137a4e33db53",
                "555c2dede4b044c3499b04f8",
                "555c2e8ce4b044c3499b09fe",
                "555c2e90e4b044c3499b0a24",
                "555c2e93e4b044c3499b0a3e",
                "555c2e89e4b044c3499b09e2",
                "555d8a4ce4b0b8cc433f7311"
            ],
            "message":"rawsenz generated."
        }
        }
        

## Extract Behavior [/behavior/]
You can extract user's behavior list from start time to end time by invoking this method with specific ***userId***, ***startTime***, ***endTime*** and ***timeScale***.

### Extract Behavior [POST]
+ Request (application/json)

       
    + Header

            X-AVOSCloud-Application-Id  : pin72fr1iaxb7sus6newp250a4pl2n5i36032ubrck4bej81,
            X-AVOSCloud-Application-Key : qs4o5iiywp86eznvok4tmhul360jczk7y67qj0ywbcq35iia

    + Body

            {
            "userId": "555d8983e4b0b8cc433f5c62",
            "startTime": 1410000000000,
            "endTime": 1440000000000,
            "timeScale": "tenMinScale"
            }
        
+ Response 201 (application/json)

        {
        "result":{
            "code":0,
            "result":{
                "behaviorData":[
                    {
                    "motionProb":{"unknown":1},
                    "tenMinScale":82,
                    "soundProb":{"scenic_spot":0.3,"traffic":0.2,"residence":0.5},
                    "poiProbLv1":{"shop":0.016434917822026524,"hallway":0.014957423719230065,"busy_street":0.019180711946056184,"flat":0.09020109305212921,"train_station":0.0021386172067842874,"living_room":0.47171305120789647,"supermarket":0.034099493685436244,"quite_street":0.051462099363445375,"bus_stop":0.019715366949585294,"bedroom":0.04643052651887983,"study_quite_office":0.015280221089777996,"forrest":0.02045756880502049,"kitchen":0.19792890863373186},
                    "timestamp":1430200000000
                    }
                ],
                "user":{"__type":"Pointer","className":"_User","objectId":"555d8983e4b0b8cc433f5c62"},
                "startTime":1430200000000,
                "endTime":1430200000000,
                "dayType":"normal",
                "objectId":"555da671e4b0b8cc43428c41",
                "createdAt":"2015-05-21T09:33:37.156Z",
                "updatedAt":"2015-05-21T09:33:37.156Z"
            },
            "message":"behavior generated."
        }
        }
