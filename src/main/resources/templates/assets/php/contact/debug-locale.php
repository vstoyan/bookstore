<?php

$locale = "";

echo "Testing locale: " . $locale . "<br/>";

$putenv_debug = putenv( "LC_ALL=$locale" );
if ( !$putenv_debug ) exit("DEBUG: putenv failed!");

$setlocale_debug = setlocale( LC_ALL, $locale );
if( !$setlocale_debug ) exit("DEBUG: setlocale failed!");

$domain = "contact";
$bindtextdomain_debug = bindtextdomain( $domain, "./languages" );
echo "\$bindtextdomain_debug: " . $bindtextdomain_debug . "<br/>";

textdomain( $domain );
$textdomain = textdomain( $domain );
echo "\$textdomain: " .  $textdomain . "<br/>";
echo gettext("Request must come from Ajax");
