<?php
	define('API_KEY', '20lQLz13fgES56ngXYqnGDQTRPqY5bF7');

	function sendPost($data) {
		$data = array("Client_CreateStamp" => array("value" => "6/23/2017", "operator" => "date_equals"));
	    $ch = curl_init();
	    // you should put here url of your getinfo.php script
	    curl_setopt($ch, CURLOPT_URL, 'https://fluoncallproject.communityos.org/api/talus_client_search');
	    curl_setopt($ch,  CURLOPT_RETURNTRANSFER, true); 
	    curl_setopt($ch, CURLOPT_POST, 1);
	    curl_setopt($ch, CURLOPT_POSTFIELDS, $data);
	    curl_setopt($ch, CURLOPT_HTTPHEADER, array(
		    'Authorization-Token: 20lQLz13fgES56ngXYqnGDQTRPqY5bF7',
		    )
	    );
	    $result = curl_exec ($ch); 
	    curl_close ($ch); 
	    return $result; 
	}

	$data = sendPost( array('get_info'=>1) );
	// echo substr($data,1, 30);
	// echo json_encode($data);
	echo $data;
	// echo json_encode($data["result"]);
	// echo json_encode(array('apple', 'orange', 'banana', 'strawberry'));
	// echo 'success';
	// echo json_encode(array("key" => "Key goes here"));
	// echo json_encode(array("Authorization-Token" => "20lQLz13fgES56ngXYqnGDQTRPqY5bF7"));
?>