/*!
 ______ _____   _______ _______ _______ _______ ______ _______ 
|   __ \     |_|    ___|_     _|   |   |       |   __ \   _   |
|    __/       |    ___| |   | |       |   -   |      <       |
|___|  |_______|_______| |___| |___|___|_______|___|__|___|___|

P L E T H O R A T H E M E S . C O M 		      (c) 2014-2015
                        
Theme Name: MEDICUS
This file contains Owlslider settings for head-panel area (#head_panel_slider).
*/

//=============== JQUERY TO PERFORM ON DOM READY ====================================================

jQuery(function($) {

    "use strict";

    var $owl = $('#head_panel_slider');			  

    $owl.owlCarousel({
        items              : themeConfig["HEAD_PANEL_OWLSLIDER"]['items'],    
        loop               : themeConfig["HEAD_PANEL_OWLSLIDER"]['loop'],
        nav                : themeConfig["HEAD_PANEL_OWLSLIDER"]['nav'],
        dots               : themeConfig["HEAD_PANEL_OWLSLIDER"]['dots'],
        autoplay           : themeConfig["HEAD_PANEL_OWLSLIDER"]['autoplay'],
        autoplayTimeout    : themeConfig["HEAD_PANEL_OWLSLIDER"]['autoplayTimeout'],
        autoplayHoverPause : themeConfig["HEAD_PANEL_OWLSLIDER"]['autoplayHoverPause'],
        autoplaySpeed      : themeConfig["HEAD_PANEL_OWLSLIDER"]['autoplaySpeed']
    });

    var $headPanelSliderOwlCarousel = $('#head_panel_slider.owl-carousel');

    $headPanelSliderOwlCarousel.find('.item .container .caption .inner').addClass("hide pause_animation");
    $headPanelSliderOwlCarousel.find('.active .item .container .caption .inner').removeClass("hide pause_animation");

    $owl.on('translated.owl.carousel', function(event) {
        $headPanelSliderOwlCarousel.find('.item .container .caption .inner').addClass("hide pause_animation");
        $headPanelSliderOwlCarousel.find('.active .item .container .caption .inner').removeClass("hide pause_animation");
    })


});

//END============ JQUERY TO PERFORM ON DOM READY ====================================================
