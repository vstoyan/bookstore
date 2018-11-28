<?php

$themeConfig = array();

/* ===============
   GLOBAL SETTINGS 
   =============== */

$themeConfig["GENERAL"] = array();

/* ===========
   TWITTER API 
   =========== */

$themeConfig["TWITTER"] = array
(
	/* KEYS AND TOKENS: https://apps.twitter.com/ -> Create new App or select existing -> Keys and Access Tokens */

	"CONSUMER_KEY"    => 'PASTE HERE',
	"CONSUMER_SECRET" => 'PASTE HERE',

	/* ACCESS TOKENS: https://dev.twitter.com/oauth/overview/application-owner-access-tokens */

	"ACCESS_TOKEN"    => 'PASTE HERE',
	"ACCESS_SECRET"   => 'PASTE HERE'
);

/* =========
   MAILCHIMP 
   ========= */

$themeConfig["MAILCHIMP"] = array
(
   "API_KEY" => "PASTE HERE",   // http://kb.mailchimp.com/article/where-can-i-find-my-api-key
   "LIST_ID" => "PASTE HERE"    // http://kb.mailchimp.com/article/how-can-i-find-my-list-id/
);

/* =============
   CONTACT FORMS 
   ============= */

$themeConfig["CONTACT_FORMS"] = array
(
   "TO_EMAIL"       => "someone@email.com",  // PUT YOUR EMAIL HERE. THIS SHOULD BE AN EMAIL ON YOUR SERVER'S DOMAIN
   "TO_NAME"        => "Recipient Name",       // PUT RECIPIENTS NAME HERE
   "TO_EMAIL2"      => "",                     // ADD 2nd RECIPIENT. LEAVE EMPTY TO DISABLE.
   "CC_RECIPIENTS"  => "",                     // ADD CC RECIPIENT(S) SEPARATED BY COMMA. LEAVE EMPTY TO DISABLE.
   "BCC_RECIPIENTS" => "",                     // ADD BCC RECIPIENT(S) SEPARATED BY COMMA. LEAVE EMPTY TO DISABLE.
   "SITENAME"       => "Your Site Name",       // PUT YOUR SITE NAME HERE
   "FORM_TEXT"      => true,                   // DISPLAY FORM INFO
   "ENABLE_CAPTCHA" => false,                   // ENABLE CAPTCHA

   /* USE GMAIL SMTP SERVER 

       ATTENTION: Before using Gmail's SMTP service for your contact form you have to
       allow access for a new application by going to the following address:
       https://accounts.google.com/DisplayUnlockCaptcha

   */

   "ENABLE_GMAIL"   => true,                     // TO USE GMAIL EMAIL SERVER SET VALUE TO: true
   "GMAIL_USERNAME" => "youremail@gmail.com",
   "GMAIL_PASSWORD" => "password",

   /* USE YAHOO SMTP SERVER */

   "ENABLE_YAHOO"   => false,                     // TO USE YAHOO EMAIL SERVER SET VALUE TO: true
   "YAHOO_USERNAME" => "youremail@yahoo.com",
   "YAHOO_PASSWORD" => "password",

   "USE_SENDMAIL"   => false,
   "SEND_PLAINTEXT" => false,                    // SEND PLAINTEXT MESSAGE
   "ENABLE_DEBUG"   => false,

   /* GoDaddy CONFIGURATION SETTINGS: Set value to 'true' if you're on GoDaddy. 
      ATTENTION: Make sure $to_Email contains an email address on your domain 
   */

   "ENABLE_GODADDY" => false,

   /* HERE YOU CAN TRANSLATE THE VARIOUS TEXT MESSAGES RETURNED FROM THE SCRIPT. */

   "MESSAGES" => array(

     "non_ajax"      => _("Request must come from Ajax"),
     "empty_fields"  => _("Input fields are empty!"),
     "invalid_email" => _("Please enter a valid email!"),
     "short_message" => _("Too short message! Please enter something."),
     "thank_you"     => _("Thank you %s! Your message was successfully sent."),
     "mail_error"    => _("Could not send mail! Please check your PHP mail configuration."),
     "mail_success"  => _("Thank you %s! Your message was successfully sent."),
     "contact_form"  => _("[This message was sent from %s ]"),
     "message_from"  => _("New message from "),
     "phone"         => _("Phone Number: %s"),
     "captcha_error" => _("Invalid captcha!")

    ),

   ////////// APPOINTMENT FORM CONFIGURATION //////////

   "APPOINTMENT" => array(

     "new_appointment"  => _("New Appointment for Mrs/Mr %s"),
     "department"       => _("Department: %s"), 
     "appointment_date" => _("Scheduled for: %s"),
     "client_section"   => _("CLIENT INFORMATION:"),
     "birthdate"        => _("Birth Date: %s"),
     "sex"              => _("Sex: %s"),
     "email"            => _("Email Address: %s"),
     "phone"            => _("Phone Number: %s"),
     "message"          => _("Client Message: %s"),
     "sent_from"        => _("[ This message was sent from %s ]")

   )

);