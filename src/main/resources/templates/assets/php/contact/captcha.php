<?php
/*
 ______ _____   _______ _______ _______ _______ ______ _______ 
|   __ \     |_|    ___|_     _|   |   |       |   __ \   _   |
|    __/       |    ___| |   | |       |   -   |      <       |
|___|  |_______|_______| |___| |___|___|_______|___|__|___|___|

P L E T H O R A T H E M E S . C O M                   (c) 2014

FILE DESCRIPTION: CAPTCHA SCRIPT v.1.0.0 (SERVER-SIDE)

*/

session_start();

// CREATE AND SERVER CAPTCHA IMAGE

$string = "";
for ( $i = 0; $i < 5; $i++ ) { $string .= chr(rand(97, 122)); }
 
$_SESSION['random_code'] = $string;

$im        = imagecreate(90, 30);						// WIDTH, HEIGHT
$bg        = imagecolorallocate($im, 255, 107, 16); 	// BACKGROUND COLOR
$textcolor = imagecolorallocate($im, 255, 255, 255); 	// TEXT COLOR
$font_size = 12; 										// FONT SIZE
$font_file = "./AHGBold.ttf";								// FONT FILE
$x         = 15; 			
$y         = 20;

imagefilledrectangle( $im,0,0,200,100, $bg ); 			// FILL BACKGROUND

for ( $i = 0;  $i < strlen( $string );  $i++ ) { 
	imagettftext( $im, $font_size, rand(2,2), $x, $y + rand(-5,5), $textcolor ,$font_file , $string[$i]);
	//$textcolor = imagecolorallocate( $im, rand(0,100), rand(0,100), rand(0,100) );
	$x         = $x + 12;
}

header('Content-type: image/png');
imagepng($im);
imagedestroy($im);
