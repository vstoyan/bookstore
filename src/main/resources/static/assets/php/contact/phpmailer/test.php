<?php

echo "<h1>Testing PHPMailer Script | PlethoraThemes</h1>";

require('./PHPMailerAutoload.php');
$mail = new PHPMailer;
$to_Email = "your@email.here";      /*** PUT YOUR EMAIL HERE ***/
$to_Name  = "TestingForm";           
$siteName = "Testing PHP Mailer";           
$formText = true;

$mail->SetFrom( "test@email.net","TEST USER");
$mail->addAddress( $to_Email, $to_Name);      
$mail->CharSet = "UTF-8";
$mail->isHTML(true);
$mail->Subject = "SUBJECT";
$mail->Body    = "BODY TEST";

$mail->SMTPDebug = 2;
$mail->Debugoutput = 'html';

/* REMOVE TO USE GMAIL OR THIRD PARTY SMTP

$mail->isSMTP();                                    // SET MAILER TO USE SMTP
$mail->Host         = 'smtp.gmail.com';             // SPECIFY MAIN AND BACKUP SERVERS
$mail->SMTPAuth     = true;                         // ENABLE SMTP AUTHENTICATION
$mail->Username     = 'youremail@gmail.com';        // SMTP USERNAME
$mail->Password     = "password";                   // SMTP PASSWORD
$mail->SMTPSecure   = 'tls';                        // ENABLE ENCRYPTION 'ssl' ALSO ACCEPTED
$mail->Port         = 587;

REMOVE TO USE GMAIL OR THIRD PARTY SMTP */

$res = ( $mail->send() )? "<h1>SUCCESS</h1>" : "<h1>FAILURE</h1>";
echo $res;