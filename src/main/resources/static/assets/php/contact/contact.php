<?php
/*
 ______ _____   _______ _______ _______ _______ ______ _______ 
|   __ \     |_|    ___|_     _|   |   |       |   __ \   _   |
|    __/       |    ___| |   | |       |   -   |      <       |
|___|  |_______|_______| |___| |___|___|_______|___|__|___|___|

P L E T H O R A T H E M E S . C O M               (c) 2014-2015

FILE DESCRIPTION: EMAIL SUBMISSION SCRIPT v.1.0.3 (SERVER-SIDE)

BASED ON PHPMailer / https://github.com/PHPMailer/PHPMailer 

FOR MORE INFORMATION ON PHPMAILER'S SETTINGS AND CONFIGURATION:

http://phpmailer.github.io/PHPMailer/classes/PHPMailer.html

NOTES: Recipient email address $to_Email will appear as the sender but not in the Reply-to field.
       It is recommended that you use an email hosted in the same host as the site, since some
       hosts don't allow PHP to send emails from uknown senders due to antispam policies.

*/

define( 'ABSPATH', dirname(__FILE__) . '/' );

if ( $_POST ):
    
    require('./config.php');

    // HELPER PARSER FUNCTION
    function parseLine( $text, $data = "", $newline = true, $newlineChar = "\r\n<br/><br/>" ){
        if ( $text !== "" ){
            if ( $newline ) $text .= $newlineChar;
            return sprintf( $text, $data );
        } else {
            return "";
        }
    }

    if ( $enableCaptcha ){ session_start(); }

    header('Content-type: application/json');

    if( !isset( $_SERVER['HTTP_X_REQUESTED_WITH'] ) && strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) != 'xmlhttprequest') {
        $output = json_encode(
        array(
            'type' => 'error', 
            'text' => $messages['non_ajax']
        ));
        die( $output );
    } 

    if( 
        !isset($_POST["userEmail"]) || 
        !isset($_POST["userName"]) || 
        !isset($_POST["userMessage"]) ||
        !isset($_POST["userSubject"]) 
        )
    {
        $output = json_encode(array('type'=>'error', 'text' => $messages['empty_fields'] ));
        die( $output );
    }
    
    // DETECT & PREVENT FROM HEADER INJECTIONS
     $malicious = "/(content-type|bcc:|cc:|to:|href)/i";
     foreach ( $_POST as $key => $val ) {
         if ( preg_match( $malicious, $val ) ) {
           exit( 'FAILURE' );
       }

    }

    $user_Captcha         = filter_var( trim($_POST["userCaptcha"]), FILTER_SANITIZE_STRING );
    $user_Email           = filter_var( trim($_POST["userEmail"]), FILTER_SANITIZE_EMAIL );
    $user_Name            = filter_var( trim($_POST["userName"]), FILTER_SANITIZE_STRING );
    $user_Phone           = filter_var( trim($_POST["userPhone"]), FILTER_SANITIZE_STRING );  
    $user_Message         = filter_var( trim($_POST["userMessage"]), FILTER_SANITIZE_STRING );
    $user_Subject         = filter_var( trim($_POST["userSubject"]), FILTER_SANITIZE_STRING );
    
    if( !filter_var($user_Email, FILTER_VALIDATE_EMAIL) ) 
    {
        $output = json_encode(array('type'=>'error', 'text' => sprintf( $messages['invalid_email'], $user_Name ) ));
        die($output);
    }
    if( strlen( $user_Message ) < 5 ) //CHECK FOR EMPTY OR SHORT MESSAGE
    {
        $output = json_encode(array('type'=>'error', 'text' => sprintf( $messages['short_message'] ) ));
        die($output);
    }
    if ( $enableCaptcha ){
        if ( $user_Captcha == "" || $user_Captcha !== $_SESSION['random_code'] ){
            $output = json_encode(array('type'=>'error', 'text' => sprintf( $messages['captcha_error'] . " : " . $user_Captcha ) ));
            die($output);
        }
    }

    require './phpmailer/PHPMailerAutoload.php';
    $mail = new PHPMailer;

    /*** USING GMAIL TO SEND EMAILS ***/

    if ( $enableGmail ){

        $mail->isSMTP();                                    // SET MAILER TO USE SMTP
        $mail->Host         = 'smtp.gmail.com';             // SPECIFY MAIN AND BACKUP SERVERS
        $mail->SMTPAuth     = true;                         // ENABLE SMTP AUTHENTICATION
        $mail->Username     = $gmailUsername;               // SMTP USERNAME
        $mail->Password     = $gmailPassword;               // SMTP PASSWORD
        $mail->SMTPSecure   = 'tls';                        // ENABLE ENCRYPTION 'ssl' ALSO ACCEPTED
        $mail->Port         = 587;
   
    }

    if ( $enableYahoo ){

        $mail->isSMTP();                                    // SET MAILER TO USE SMTP
        $mail->Host         = 'smtp.mail.yahoo.com';        // SPECIFY MAIN AND BACKUP SERVERS
        $mail->SMTPAuth     = true;                         // ENABLE SMTP AUTHENTICATION
        $mail->Username     = $yahooUsername;               // SMTP USERNAME
        $mail->Password     = $yahooPassword;               // SMTP PASSWORD
        $mail->SMTPSecure   = 'ssl';                        // ENABLE ENCRYPTION 'ssl' ALSO ACCEPTED
        $mail->Port         = 465;
   
    }

    if ( $enableDebug ){
        $mail->SMTPDebug = 2;
        $mail->Debugoutput = 'html';
    }

    /* SEND EMAIL USING SENDMAIL */
    if ( $useSendmail ){ $mail->isSendmail(); }

    $mail->SetFrom( $to_Email, $to_Name);               
    $mail->addAddress( $to_Email, $to_Name);                // ADD A RECIPIENT. NAME IS OPTIONAL.
    $mail->addReplyTo( $user_Email, $user_Name);            // ADD Reply To FIELD

    /*** ADD ANOTHER RECIPIENT ***/
    if ( $to_EmailNo2 !== "" ) { $mail->addAddress($to_EmailNo2); }

    /*** ADD CC RECIPIENTS ***/
    foreach( explode( ",", $ccRecipients ) as $email ){
       $mail->addCC( $email );
    }
    /*** ADD BCC RECIPIENTS ***/
    foreach( explode( ",", $bccRecipients ) as $email ){
       $mail->addBCC( $email );
    }

    if ( $enableGoDaddy ){
        $mail->Host = "relay-hosting.secureserver.net"; // Also try: smtpout.secureserver.net
        $mail->Port = 25;
        $mail->SMTPAuth = true; // If not working, also test by setting this value to: false
        $mail->SMTPSecure = "ssl";
    }

    $mail->isHTML(true);                                    // SET EMAIL FORMAT TO HTML
    $mail->CharSet = "UTF-8";    
    $mail->Subject = $user_Subject;
    $mail->Body    = ($formText)? 

        "[" 
        . $messages['message_from'] . $user_Name . " : " . $user_Email . " ]\n\r<br/><br/>" 
        . sprintf( $messages['phone'], $user_Phone ) . "\n\r<br/><br/>" 
        . $user_Message . "\n\r<br/><br/>" 
        . $messages['contact_form'] 

        : 

        $user_Message;

    if ( $sendPlainText ){
        $mail->AltBody = $user_Message;
    }

    if( ! $mail->send() )
    {
        $output = json_encode(array('type'=>'error', 'text' => sprintf( $messages['mail_error'] . "Error:" . $mail->ErrorInfo ) ));
        die( $output );

    } else {

        $output = json_encode(array('type'=>'message', 'text' => sprintf( $messages['mail_success'], $user_Name ) ));
        die( $output );

    }

endif;