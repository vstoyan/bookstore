/*!
 ______ _____   _______ _______ _______ _______ ______ _______ 
|   __ \     |_|    ___|_     _|   |   |       |   __ \   _   |
|    __/       |    ___| |   | |       |   -   |      <       |
|___|  |_______|_______| |___| |___|___|_______|___|__|___|___|

P L E T H O R A T H E M E S . C O M 				     (c) 2014
                        
Theme Name: Medicus
This file contains Flexslider settings for Twitter Slider. Loaded only when twitter slider is present.

*/

jQuery(document).ready(function($) {

    "use strict";			 

    var $twitterFlexslider = $(themeConfig["TWITTER"].twitterContainer);

    if ( $twitterFlexslider.length ) {

        $twitterFlexslider.twittie({

            username    : themeConfig["TWITTER"].twitterUserName,              
            apiPath     : themeConfig["TWITTER"].apiPath,                      
            template    : themeConfig["TWITTER"].template,
            count       : themeConfig["TWITTER"].tweetCount,                   
            dateFormat  : '%b. %d, %Y',                 // Your date format
            ulClass     : "slides",                     // Class for the ul element that contains the tweets
            liClass     : "items"                       // Class for the li element that contains each tweet
          //,list       : null                          // List name to load tweets from. If you define list name you also must define the username of the list owner in the username option.
          //,hashtag    : null                          // Option to load tweets with a specific hashtag.
          //,hideReplies: false                         // Set true if you want to hide "@" replies as well. Or leave it false to just to show your tweets and no replies.

        }, function(data) {

            _p.debugLog("TWITTER FEED RESPONSE (data): ", data);

            $twitterFlexslider.find("ul.slides").owlCarousel({

                items : 1,
                loop  : true

            });

            /* DEPRECATED CODE: Using FlexSlider */
            /*
            $twitterFlexslider.flexslider({

                controlNav     : false,
                namespace      : "flex-",               // {NEW} String: Prefix string attached to the class of every element generated by the plugin
                selector       : ".slides > li",        // {NEW} Selector: Must match a simple pattern. '{container} > {slide}' -- Ignore pattern at your own peril
                animation      : "slide",               // String: Select your animation type, "fade" or "slide"
                easing         : "swing",               // {NEW} String: Determines the easing method used in jQuery transitions. jQuery easing plugin is supported!
                direction      : themeConfig["TWITTER"].direction,             
                reverse        : themeConfig["TWITTER"].reverseDirection,      
                animationLoop  : true,                  // Boolean: Should the animation loop? If false, directionNav will received "disable" classes at either end
                smoothHeight   : false,                 // {NEW} Boolean: Allow height of the slider to animate smoothly in horizontal mode
                startAt        : 0,                     // Integer: The slide that the slider should start on. Array notation (0 = first slide)
                slideshow      : true,                  // Boolean: Animate slider automatically
                slideshowSpeed : themeConfig["TWITTER"].slideshowSpeed * 1000, 
                animationSpeed : 600,                   // Integer: Set the speed of animations, in milliseconds
                initDelay      : 0                      // {NEW} Integer: Set an initialization delay, in milliseconds
                ,start: function(){
                    if ( themeConfig["TWITTER"].direction === "vertical" ) $twitterFlexslider.find("ul.flex-direction-nav").addClass("vertical");
                }

            });
            */            

        });

    }

});