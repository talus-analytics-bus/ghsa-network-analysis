<?php
	session_start();
	
	if (isset($_SESSION['user_id'])) {
		echo json_encode(array("logged_in" => 1, "user_id" => $_SESSION['user_id']));
	} else {
		echo json_encode(array("error" => "Please login before continuing."));
	}
?>