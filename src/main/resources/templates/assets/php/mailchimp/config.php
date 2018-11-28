<?php

require("../config.php");

/*** CONFIGURE MAILCHIMP ***/

$mailChimp_ApiKey = $themeConfig["MAILCHIMP"]["API_KEY"];  // http://kb.mailchimp.com/article/where-can-i-find-my-api-key
$mailChimp_ListId = $themeConfig["MAILCHIMP"]["LIST_ID"];  // http://kb.mailchimp.com/article/how-can-i-find-my-list-id/