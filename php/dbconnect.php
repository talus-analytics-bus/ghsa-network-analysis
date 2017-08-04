<?php
	require_once('dbconfig.php');	
	try {
    	$dbh = new PDO('mysql:host=' . MYSQL_HOSTNAME . ';dbname=' . MYSQL_DATABASE . ';charset=utf8', MYSQL_USERNAME, MYSQL_PASSWORD);
	} catch(PDOException $e) {
		echo json_encode(array(
			'error' =>  $e->getMessage()
		));
		die();
	}
?>