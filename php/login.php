<?php
	require_once('dbconnect.php');		
	
	$username = $_REQUEST['username'];
	$password = $_REQUEST['password'];
	
	$query = 'SELECT * FROM users WHERE username LIKE "' . $username . '"';
	$statement = $dbh->prepare($query);
	$statement->execute();
	$result = $statement->fetchAll(PDO::FETCH_ASSOC);
		
	if ($result) {
		if (password_verify($password, $result[0]['passhash'])) {
			// passwords match
			session_start();
			$_SESSION['user_id'] = $result[0]['username'];
			$_SESSION['user_agent'] = $_SERVER['HTTP_USER_AGENT'];
			
			// update last login time
			$query = 'UPDATE users SET last_login = :lastLogin WHERE username = :userName';			
			$statement = $dbh->prepare($query);
			$statement->bindParam(':lastLogin', date('Y-m-d H:i:s'));
			$statement->bindParam(':userName', $username);
			$statement->execute();
			$result = $statement->fetchAll(PDO::FETCH_ASSOC);
			
			// return success
			echo json_encode(array('success' => $username));
		} else {
			// password did not match
			echo json_encode(array('error' => 'Password entered is incorrect.', '' => ''));
		}
	} else {
		// no records in database for username
		echo json_encode(array('error' => 'Username was not found.'));
	}
?>