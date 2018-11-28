<?php

define( 'ABSPATH', dirname(__FILE__) . '/' );

require('module-mailchimp.php');
require('config.php');

if ( $mailChimp_ApiKey === "PASTE HERE" || $mailChimp_ListId === "PASTE HERE" ){

	die( json_encode( array( 

		"status" => "error",
		"name"   => "configuration",
		"error"  => "PLEASE ENTER YOUR MAILCHIMP API KEY AND LIST ID IN THE CONFIGURATION FILE"

		) ) );

}

$MailChimp = new Plethora_Module_Mailchimp( $mailChimp_ApiKey );
$result = $MailChimp->call('lists/subscribe', array(
                'id'                => $mailChimp_ListId,
                'email'             => array('email'=> $_POST['email'] ),
                'double_optin'      => false,
                'update_existing'   => true,
                'replace_interests' => false,
                'send_welcome'      => false,
              //'merge_vars'        => array('FNAME'=>'Davy', 'LNAME'=>'Jones'),
            ));

die( json_encode( $result ) );

