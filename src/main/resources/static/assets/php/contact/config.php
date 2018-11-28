<?php

// if ( ! defined( 'ABSPATH' ) ) exit; // NO DIRECT ACCESS 

require("../config.php");

$to_Email                 = $themeConfig["CONTACT_FORMS"]["TO_EMAIL"];
$to_Name                  = $themeConfig["CONTACT_FORMS"]["TO_NAME"];          

$to_EmailNo2              = $themeConfig["CONTACT_FORMS"]["TO_EMAIL2"];                        
$ccRecipients             = $themeConfig["CONTACT_FORMS"]["CC_RECIPIENTS"];                        
$bccRecipients            = $themeConfig["CONTACT_FORMS"]["BCC_RECIPIENTS"];                        

$siteName                 = $themeConfig["CONTACT_FORMS"]["SITENAME"];          
$formText                 = $themeConfig["CONTACT_FORMS"]["FORM_TEXT"];                      
$enableCaptcha            = $themeConfig["CONTACT_FORMS"]["ENABLE_CAPTCHA"];                      

$enableGmail              = $themeConfig["CONTACT_FORMS"]["ENABLE_GMAIL"];                     
$gmailUsername            = $themeConfig["CONTACT_FORMS"]["GMAIL_USERNAME"];
$gmailPassword            = $themeConfig["CONTACT_FORMS"]["GMAIL_PASSWORD"];

$enableYahoo              = $themeConfig["CONTACT_FORMS"]["ENABLE_YAHOO"];                     
$yahooUsername            = $themeConfig["CONTACT_FORMS"]["YAHOO_USERNAME"];
$yahooPassword            = $themeConfig["CONTACT_FORMS"]["YAHOO_PASSWORD"];

$useSendmail              = $themeConfig["CONTACT_FORMS"]["USE_SENDMAIL"];
$sendPlainText            = $themeConfig["CONTACT_FORMS"]["SEND_PLAINTEXT"];                    
$enableDebug              = $themeConfig["CONTACT_FORMS"]["ENABLE_DEBUG"];

$enableGoDaddy            = $themeConfig["CONTACT_FORMS"]["ENABLE_GODADDY"];

$messages                  = $themeConfig["CONTACT_FORMS"]["MESSAGES"];
$messages["contact_form"]  = sprintf( $messages["contact_form"], $themeConfig["CONTACT_FORMS"]["SITENAME"] );

$appointment              = $themeConfig["CONTACT_FORMS"]["APPOINTMENT"];
$appointment["sent_from"] = sprintf( $appointment["sent_from"], $themeConfig["CONTACT_FORMS"]["SITENAME"] );