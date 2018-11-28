/*
	By Osvaldas Valutis, www.osvaldas.info
	Available for use under the MIT License

	Additions by Kostas Minaidis, https://github.com/kostasx
*/

;( function( $, window, document, undefined ){
	'use strict';

	var cssTransitionSupport = function(){
		var s = document.body || document.documentElement, s = s.style;
		if( s.WebkitTransition == '' ) return '-webkit-';
		if( s.MozTransition == '' ) return '-moz-';
		if( s.OTransition == '' ) return '-o-';
		if( s.transition == '' ) return '';
		return false;
	},

	isCssTransitionSupport = cssTransitionSupport() === false ? false : true,

	cssTransitionTranslateX = function( element, positionX, speed ){
		var options = {}, prefix = cssTransitionSupport();
		options[ prefix + 'transform' ]	 = 'translateX(' + positionX + ')';
		options[ prefix + 'transition' ] = prefix + 'transform ' + speed + 's linear';
		element.css( options );
	},

	hasTouch	= ( 'ontouchstart' in window ),
	hasPointers = window.navigator.pointerEnabled || window.navigator.msPointerEnabled,
	wasTouched	= function( event ){
		if( hasTouch ) return true;
		if( !hasPointers || typeof event === 'undefined' || typeof event.pointerType === 'undefined' ) return false;
		if( typeof event.MSPOINTER_TYPE_MOUSE !== 'undefined' ){
			if ( event.MSPOINTER_TYPE_MOUSE != event.pointerType ) return true;
		} else
			if( event.pointerType != 'mouse' ) return true;
		return false;
	};

	$.fn.imageLightbox = function( options ){
		var options	   = $.extend({
			 	selector:		'id="imagelightbox"',
			 	allowedTypes:	'png|jpg|jpeg|gif',
				// /([-a-zA-Z0-9@:%_\+.~#?&//=]{2,256}\.[a-z]{2,4}\b(\/[-a-zA-Z0-9@:%_\+.~#?&//=]*)?(?:jpg|jpeg|gif|png))/gi;
			 	allowedVideos: 	'youtube\.com|youtu\.be|vimeo\.com|dailymotion\.com|dai\.ly',		// ADDED: Video Support
			 	animationSpeed:	250,
			 	preloadNext:	true,
			 	enableKeyboard:	true,
			 	quitOnEnd:		false,
			 	quitOnImgClick: false,
			 	quitOnDocClick: true,
			 	onStart:		false,
			 	onEnd:			false,
			 	onLoadStart:	false,
			 	onLoadEnd:		false
			 }, options ),
			targets		= $([]),
			target		= $(),
			image		= $(),
			imageWidth	= 0,
			imageHeight = 0,
			swipeDiff	= 0,
			inProgress	= false,

			isTargetValid = function( element ){
				// ADDED: Allow YouTube/Vimeo embeds
				return $( element ).prop( 'tagName' ).toLowerCase() == 'a' && ( new RegExp( '\.(' + options.allowedTypes + ')$|' + options.allowedVideos, 'i' ) ).test( $( element ).attr( 'href' ) );
				// return $( element ).prop( 'tagName' ).toLowerCase() == 'a' && ( new RegExp( '\.(' + options.allowedTypes + ')$', 'i' ) ).test( $( element ).attr( 'href' ) );
			},

			setImage = function(){
				if( !image.length ) return true;

				var screenWidth	 = $( window ).width() * 0.8,
					screenHeight = $( window ).height() * 0.9,
					tmpImage 	 = new Image();

				tmpImage.src	= image.attr( 'src' );
				tmpImage.onload = function(){
					imageWidth	 = tmpImage.width;
					imageHeight	 = tmpImage.height;

					if( imageWidth > screenWidth || imageHeight > screenHeight ){
						var ratio	 = imageWidth / imageHeight > screenWidth / screenHeight ? imageWidth / screenWidth : imageHeight / screenHeight;
						imageWidth	/= ratio;
						imageHeight	/= ratio;
					}
					image.css({
						'width':  imageWidth + 'px',
						'height': imageHeight + 'px',
						'top':    ( $( window ).height() - imageHeight ) / 2 + 'px',
						'left':   ( $( window ).width() - imageWidth ) / 2 + 'px'
					});
				};
			},

			loadImage = function( direction ){
				if ( inProgress ) return false;
				direction = typeof direction === 'undefined' ? false : direction == 'left' ? 1 : -1;

				if( image.length ){
					if( direction !== false && ( targets.length < 2 || 
						( options.quitOnEnd === true && 
							( ( direction === -1 && targets.index( target ) == 0 ) 
								|| ( direction === 1 && targets.index( target ) == targets.length - 1 ) ) ) ) ) {
						quitLightbox();
						return false;
					}
					var params = { 'opacity': 0 };
					if( isCssTransitionSupport ) cssTransitionTranslateX( image, ( 100 * direction ) - swipeDiff + 'px', options.animationSpeed / 1000 );
					else params.left = parseInt( image.css( 'left' ) ) + 100 * direction + 'px';
					image.animate( params, options.animationSpeed, function(){ removeImage(); });
					swipeDiff = 0;
				}

				inProgress = true;
				if( options.onLoadStart !== false ) options.onLoadStart();

				setTimeout( function(){

					/*====== IF LINK IS YOUTUBE/VIMEO/DAILYMOTION VIDEO ======*/

					if ( ( new RegExp( options.allowedVideos, 'i' ) ).test( target[0].href ) ){

						image = $("<div>");
						image.attr("id", "imagelightbox");
						image.attr("src", target[0].href);

						var screenWidth	 = $( window ).width() * 0.8,
							screenHeight = $( window ).height() * 0.9,
							imageWidth	 = 560;
							imageHeight	 = 315;

							if( imageWidth > screenWidth || imageHeight > screenHeight ){
								var ratio	 = imageWidth / imageHeight > screenWidth / screenHeight ? imageWidth / screenWidth : imageHeight / screenHeight;
								imageWidth	/= ratio;
								imageHeight	/= ratio;
							}

							image.css({
								"zIndex" : 10001,
								"width" : imageWidth + 'px',
								"height" : imageHeight + 'px',
								"top" : ( $( window ).height() - imageHeight ) / 2 + 'px',
								"left" : ( $( window ).width() - imageWidth ) / 2 + 'px',
								"backgroundColor" : "#333"
							});

						var videoEmbed = $("<iframe>");

							/*====== DETECT YOUTUBE/VIMEO/DAILYMOTION ======*/

							var videoLink;
							var vimeoRegExp    = /(?:http?s?:\/\/)?(?:www\.)?(?:vimeo\.com)\/?(.+)/g;
							var youtubeRegExp  = /(?:http?s?:\/\/)?(?:www\.)?(?:youtube\.com|youtu\.be)\/(?:watch\?v=)?(.+)/g;
							var dailyMotionExp = /(?:http?s?:\/\/)?(?:www\.)?(?:dailymotion\.com|dai\.ly)\/(?:video\/)?(.+)/g;

							/*====== VIMEO VIDEO ======*/
							if ( vimeoRegExp.test( target[0].href ) ){

								// console.log("Vimeo video link detected...");
								videoLink = ( new RegExp( "(?:http?s?:\/\/)?(?:www\.)?(?:vimeo\.com)\/?(.+)", "g" ) ).exec( target[0].href )[1];
								// https://vimeo.com/64884546 -> src="//player.vimeo.com/video/64884546" + 
								// &amp;autoplay=1
								videoLink = "//player.vimeo.com/video/" + videoLink;

							/*====== YOUTUBE VIDEO ======*/
							} else if ( youtubeRegExp.test( target[0].href ) ) {

								// console.log("YouTube video link detected...", target[0].href);
								videoLink = ( new RegExp( "(?:http?s?:\/\/)?(?:www\.)?(?:youtube\.com|youtu\.be)\/(?:watch\\?v=)?(.+)", "g" ) ).exec( target[0].href )[1];
								// (.+) --> ([^"&?\/ ]{11})
								// (.+) --> ([^#\&\?]*)
								videoLink = "//www.youtube.com/embed/" + videoLink;
								// YOUTUBE: https://www.youtube.com/watch?v=30uTT3SsPzA -> src="//www.youtube.com/embed/30uTT3SsPzA"

							/*====== DAILYMOTION VIDEO ======*/
							} else if ( dailyMotionExp.test( target[0].href ) ) {
								videoLink = ( new RegExp( "(?:http?s?:\/\/)?(?:www\.)?(?:dailymotion\.com|dai\.ly)\/(?:video\/)?(.+)" ,"g") ).exec( target[0].href )[1];
								videoLink = "//www.dailymotion.com/embed/video/" + videoLink.slice(0,7);
								console.log(videoLink);
								// http://www.dailymotion.com/video/x2gryoe_health-tips-and-benefits_people --> src="//www.dailymotion.com/embed/video/x2gryoe" 
							} 

							videoEmbed.css({
								"frameBorder" : 0,							
								"width"       : imageWidth + "px",
								"height"      : imageHeight + "px",
								"id"          : "videoEmbed"
							});
							videoEmbed.attr("src", videoLink);

							videoEmbed.appendTo(image);
							image.appendTo( 'body' );
							videoEmbed.on("load", function(){
								inProgress = false;
								if( options.onLoadEnd !== false ) options.onLoadEnd();
							});

					} else {

						image = $( '<img ' + options.selector + ' />' )
						.attr( 'src', target.attr( 'href' ) )
						.load( function(){
							image.appendTo( 'body' );
							setImage();

							var params = { 'opacity': 1 };

							image.css( 'opacity', 0 );
							if( isCssTransitionSupport ){
								cssTransitionTranslateX( image, -100 * direction + 'px', 0 );
								setTimeout( function(){ cssTransitionTranslateX( image, 0 + 'px', options.animationSpeed / 1000 ) }, 50 );
							} else {
								var imagePosLeft = parseInt( image.css( 'left' ) );
								params.left = imagePosLeft + 'px';
								image.css( 'left', imagePosLeft - 100 * direction + 'px' );
							}

							image.animate( params, options.animationSpeed, function() {
								inProgress = false;
								if( options.onLoadEnd !== false ) options.onLoadEnd();
							});
							if( options.preloadNext ){
								var nextTarget = targets.eq( targets.index( target ) + 1 );
								if( !nextTarget.length ) nextTarget = targets.eq( 0 );
								$( '<img />' ).attr( 'src', nextTarget.attr( 'href' ) ).load();
							}
						})
						.error( function(){
							if( options.onLoadEnd !== false ) options.onLoadEnd();
						})

						var swipeStart	 = 0,
							swipeEnd	 = 0,
							imagePosLeft = 0;

						image.on( hasPointers ? 'pointerup MSPointerUp' : 'click', function( e ){
							e.preventDefault();
							if( options.quitOnImgClick ){
								quitLightbox();
								return false;
							}
							if( wasTouched( e.originalEvent ) ) return true;
						    var posX = ( e.pageX || e.originalEvent.pageX ) - e.target.offsetLeft;
							target = targets.eq( targets.index( target ) - ( imageWidth / 2 > posX ? 1 : -1 ) );
							if( !target.length ) target = targets.eq( imageWidth / 2 > posX ? targets.length : 0 );
							loadImage( imageWidth / 2 > posX ? 'left' : 'right' );
						})
						.on( 'touchstart pointerdown MSPointerDown', function( e ){
							if( !wasTouched( e.originalEvent ) || options.quitOnImgClick ) return true;
							if( isCssTransitionSupport ) imagePosLeft = parseInt( image.css( 'left' ) );
							swipeStart = e.originalEvent.pageX || e.originalEvent.touches[ 0 ].pageX;
						})
						.on( 'touchmove pointermove MSPointerMove', function( e ){
							if( !wasTouched( e.originalEvent ) || options.quitOnImgClick ) return true;
							e.preventDefault();
							swipeEnd = e.originalEvent.pageX || e.originalEvent.touches[ 0 ].pageX;
							swipeDiff = swipeStart - swipeEnd;
							if( isCssTransitionSupport ) cssTransitionTranslateX( image, -swipeDiff + 'px', 0 );
							else image.css( 'left', imagePosLeft - swipeDiff + 'px' );
						})
						.on( 'touchend touchcancel pointerup pointercancel MSPointerUp MSPointerCancel', function( e ){
							if( !wasTouched( e.originalEvent ) || options.quitOnImgClick ) return true;
							if( Math.abs( swipeDiff ) > 50 ){
								target = targets.eq( targets.index( target ) - ( swipeDiff < 0 ? 1 : -1 ) );
								if( !target.length ) target = targets.eq( swipeDiff < 0 ? targets.length : 0 );
								loadImage( swipeDiff > 0 ? 'right' : 'left' );	
							} else {
								if( isCssTransitionSupport ) cssTransitionTranslateX( image, 0 + 'px', options.animationSpeed / 1000 );
								else image.animate({ 'left': imagePosLeft + 'px' }, options.animationSpeed / 2 );
							}
						});

					}

				}, options.animationSpeed + 100 );
			},

			removeImage = function(){
				if( !image.length ) return false;
				image.remove();
				image = $();
			},

			quitLightbox = function(){
				if( !image.length ) return false;
				image.animate({ 'opacity': 0 }, options.animationSpeed, function(){
					removeImage();
					inProgress = false;
					if( options.onEnd !== false ) options.onEnd();
				});
			};

		$( window ).on( 'resize', setImage );

		if( options.quitOnDocClick ){
			$( document ).on( hasTouch ? 'touchend' : 'click', function( e ){
				if( image.length && !$( e.target ).is( image ) ) quitLightbox();
			})
		}

		if( options.enableKeyboard ){
			$( document ).on( 'keyup', function( e ){
				if( !image.length ) return true;
				e.preventDefault();
				if( e.keyCode == 27 ) quitLightbox();
				if( e.keyCode == 37 || e.keyCode == 39 ){
					target = targets.eq( targets.index( target ) - ( e.keyCode == 37 ? 1 : -1 ) );
					if( !target.length ) target = targets.eq( e.keyCode == 37 ? targets.length : 0 );
					loadImage( e.keyCode == 37 ? 'left' : 'right' );
				}
			});
		}

		$( document ).on( 'click', this.selector, function( e ){
			if( !isTargetValid( this ) ) return true;
			e.preventDefault();
			if( inProgress ) return false;
			inProgress = false;
			if( options.onStart !== false ) options.onStart();
			target = $( this );
			loadImage();	// FIRED ONLY ON PORTFOLIO VIEW
		});

		this.each( function(){
			if( !isTargetValid( this ) ) return true;
			targets = targets.add( $( this ) );
		});

		this.switchImageLightbox = function( index ){
			var tmpTarget = targets.eq( index );
			if ( tmpTarget.length ){
				var currentIndex = targets.index( target );
				target = tmpTarget;
				loadImage( index < currentIndex ? 'left' : 'right' );
			}
			return this;
		};

		this.quitImageLightbox = function() {
			quitLightbox();
			return this;
		};

		return this;
	};
})( jQuery, window, document );