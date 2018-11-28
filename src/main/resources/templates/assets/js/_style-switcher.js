jQuery(function($) {
			  
	"use strict";			  

	var $styleSwitcher = $('.style_switcher');
	var $head 		   = $('head');
	var $logoImg 	   = $(".logo img");
				  
	$('.gear').click(function(){ 
		$styleSwitcher.toggleClass("gear-unfolded") 
	});

	$(".style_switcher .styles ul.color_variations").on( "click", "li", function(){

		var styleColor = this.className.replace("style-","");
		$head.find("link[href^='./assets/css/style-']").remove();
		if ( styleColor !== "default" ){
			$head.append('<link rel="stylesheet" href="./assets/css/style-' + styleColor + '.css" type="text/css" />');
		}
		$logoImg.attr("src", "./assets/images/medicus-header-logo-x64.png");

	});

	//========================== DYNAMIC STYLE SWITCHER ================================================

	var embedStyleSwitcherPanel = function( section ){

		var $styleSwitcherPanel = $("#style-switcher-template");
		var $section = $(section);
			$section.prepend( $styleSwitcherPanel.html() );
		// ENABLE LIVE CONTENT EDITING ON SECTION .container (ALTERNATIVE: document.body.designMode = "on")
		// $section.find(".container").attr("contentEditable", true);

	}

	var urlParser = document.createElement("a");
		urlParser.setAttribute("href", document.location.href);

	if ( urlParser.search.indexOf("enableStyleSwitcher") > -1 ){

		$(".main section").each(function( index, section ){  embedStyleSwitcherPanel(section);  });

	} else {

		$(".main section.instant").each(function( index, section ){  embedStyleSwitcherPanel(section);  });

	}

	initSectionStyleSwitcher($);

	//END======================= DYNAMIC STYLE SWITCHER ================================================
   
});

//========================== SECTION STYLE SWITCHER ================================================

function initSectionStyleSwitcher($){

	(function($){

		var sectionStyleSwitcher = '.section_style_switcher';

		$('.handler:not(".downloader")').click(function(){ 
			$(this).parent(sectionStyleSwitcher).toggleClass("handler-unfolded"); 
		});



		// ON CLICK: .color_section
		$('.section_styles a.color_section').on("click", function(){ 

			var noToggleClass = "transparent";

			var $this = $(this);
			var the_class    = $this.text();
			var $the_section = $this.parent().parent().parent().parent();		

				if ( $this.text() !== 'transparent' ){
					$this.parent().find("a.color_section.on:not(:contains('transparent'))").not(this).toggleClass('on');
				}

				$this.toggleClass('on');

				if ( $this.text() === noToggleClass ){
					console.log(1);
					$the_section.toggleClass(noToggleClass);	
				} else {
					console.log(2);
					if ( $the_section.hasClass(noToggleClass) ){
						console.log(2.1);
						$the_section.attr("class","").addClass(noToggleClass + " " + the_class);
					} else {
						console.log(2.2);
                 		$the_section
                 			.removeClass( "dark_section primary_section light_section black_section white_section secondary_section transparent" )
                 			.addClass(the_class);
						// $the_section.attr("class","").addClass(the_class);	
					}
				}

		});

		// ON CLICK: All the rest... to be separated out using classes
		// var $section_styles = $('.section_styles a');
		var $section_styles = $('.section_styles a:not(".color_section")');

		$section_styles.on("click", function(){ 

			var $this = $(this);
			var the_class    = $this.text();
			var $the_section = $this.parent().parent().parent().parent();		
				window.$this = $this;

				var header_height = $('.header').height();
		    	var window_height = $(window).height();
		    	var usable_height = window_height - header_height; 

				$the_section.toggleClass(the_class); 
				$this.toggleClass('on');
				$this.parent().parent().parent().parent().css( "min-height", 0 );
				$this.parent().parent().parent().parent('.full_height').css( "min-height", usable_height );
				$this.parent().parent().parent().parent('.full_height').children('.container').css('padding-top' , 0);
				$this.parent().parent().parent().parent('.vertical_center').children('.container').css('padding-top' , 0);
				$this.parent().parent().parent().parent('.vertical_bottom').children('.container').css('padding-top' , 0);

				var container_height = $this.parent().parent().parent().parent('.full_height.vertical_center').children('.container').height();
				var top_padding = (usable_height - container_height -55) * 0.5;
				if (top_padding > 0) { $this.parent().parent().parent().parent('.full_height.vertical_center').children('.container').css('padding-top' , top_padding); };  
				var top_padding_2 = (usable_height - container_height -55);
	          	if (top_padding_2 > 0) { $this.parent().parent().parent().parent('.full_height.vertical_bottom').children('.container').css('padding-top' , top_padding - header_height + 55); }; 


		});
	
		var section_header_styles = $('.section_header_styles a');

		section_header_styles.on("click", function(){ 

			var the_class_2    = $(this).text();
			var $the_section_2 = $(this).parent().parent().parent().parent().children('.container').children('.row').children('.section_header');		

				$the_section_2.toggleClass(the_class_2); 
				$(this).toggleClass('on');
				

		});

		var $col_styles = $('.column_styles a');
		var $col_select = $('ul.col_select li');
		
		$col_select.on("click", function(){
			$('ul.col_select li.on').removeClass('on');
			$(this).addClass('on');
		});

		$col_styles.on("click", function(){ 

			var the_col = $('ul.col_select li.on').text();
			var the_class_3 = $(this).text();
			var the_section_3 = $(this).parent().parent().parent().parent().children('.container').children('.row').children('div[class *="col-"]:nth-child(' + the_col + ')').not('.section_header');		

				the_section_3.toggleClass(the_class_3); 
				$(this).toggleClass('on');

				//================== SAME COLUMN HEIGHT ==========================================

				 var sameHeightCols = $(".same_height_col");

				 if ( !( window.matchMedia && window.matchMedia( "only screen and (max-width: 480px)" ).matches && sameHeightCols.length > 0 ) ){
				    sameHeightCols.conformity();
				    $(window).on( "resize", function() {  sameHeightCols.conformity();  });
				 } 

				 //END=============== SAME COLUMN HEIGHT ==========================================
				
		});

	}(jQuery));


}

//END======================= SECTION STYLE SWITCHER ================================================
    