<!DOCTYPE HTML>
<?php
/*** begin our session ***/
session_start(); 


/*** set a form token ***/
$form_token = md5( uniqid('auth', true) );

/*** set the session form token ***/
$_SESSION['form_token'] = $form_token;
if(!isset( $_POST['user_name'], $_POST['user_password'], $_POST['form_token']))
{
	if (empty($_POST['user_name']) || empty($_POST['user_password'])) {
		$message =' ';
	}
	else{
	header("location:reg.php");
    $message = 'Please enter a valid username and password';
	}
}
/*** check the username is the correct length ***/
elseif (strlen( $_POST['user_name']) > 20 || strlen($_POST['user_name']) < 4)
{
    $message = 'Incorrect Length for Username';
	
}	
/*** check the password is the correct length ***/
elseif (strlen( $_POST['user_password']) > 20 || strlen($_POST['user_password']) < 4)
{
    $message = 'Incorrect Length for Password';
}
/*** check the username has only alpha numeric characters ***/
elseif (ctype_alnum($_POST['user_name']) != true)
{
    /*** if there is no match ***/
    $message = "Username must be alpha numeric";
}
/*** check the password has only alpha numeric characters ***/
elseif (ctype_alnum($_POST['user_password']) != true)
{
        /*** if there is no match ***/
        $message = "Password must be alpha numeric";
}
elseif (ctype_alnum($_POST['user_type']) == NULL )
{
        /*** if there is no match ***/
        $message = "Please choice the login Type";
}
elseif(empty($_POST['6_letters_code'])|| strcasecmp($_SESSION['img_number'],$_POST['6_letters_code']) )
{
	$message = "Code Verification failed！";
}
elseif(empty($_POST['com_password'])|| strcasecmp($_POST['user_password'],$_POST['com_password']))
{
	$message = "Please Check your Comfirm password";
}
elseif(empty($_POST['user_email']))
{
	$message = "Please Input your email";
}
elseif(empty($_POST['phone_number']))
{
	$message = "Please tell us your correct Phone number";
	if((strlen( $_POST['phone_number']) > 11 || strlen($_POST['user_password']) < 8)){
		$message = "Your Phone number must more than 8 digits less than 11 digits";
	}
}
elseif (ctype_alnum($_POST['user_gender']) == NULL )
{
        /*** if there is no match ***/
        $message = "Please choice your gender";
}
elseif (ctype_alnum($_POST['edu_bg']) == NULL )
{
        /*** if there is no match ***/
        $message = "Please choice your education background";
}
elseif (empty($_FILES['user_id_card']))
{
	$message = 'Please upload your Identity card';
}

else
{
	
	/******* UPload images*****/
$target_dir = "ID_uploads/";
$target_file = $target_dir . basename($_FILES["user_id_card"]["name"]);
$image_name = addslashes ($_FILES["user_id_card"]["name"]);
$uploadOk = 1;
$imageFileType = pathinfo($target_file,PATHINFO_EXTENSION);
// Check if image file is a actual image or fake image
    $check = getimagesize($_FILES["user_id_card"]["tmp_name"]);
if($check = false) {
        $message = 'File is not an image';
        $uploadOk = 0;
 }
// Check if file already exists
if (file_exists($target_file)) {
    $message = 'Sorry, file already exists';
    $uploadOk = 0;
}
// Check file size
if ($_FILES["user_id_card"]["size"] > 500000) {
   $message = 'Sorry, your file is too large';
    $uploadOk = 0;
}
// Allow certain file formats
if($imageFileType != "jpg" && $imageFileType != "png" && $imageFileType != "jpeg"
&& $imageFileType != "gif" ) {
   $message = 'Sorry, only JPG, JPEG, PNG & GIF files are allowed';
    $uploadOk = 0;
}
// Check if $uploadOk is set to 0 by an error
if ($uploadOk == 0) {
   $message = 'Sorry, your file was not uploaded';
// if everything is ok, try to upload file
} 
else 
{
    move_uploaded_file($_FILES["user_id_card"]["tmp_name"], $target_file);
} 
	
 /*** if we are here the data is valid and we can insert it into database ***/
 	$user_id_card = $image_name;
    $user_name = filter_var($_POST['user_name'], FILTER_SANITIZE_STRING);
    $user_password = filter_var($_POST['user_password'], FILTER_SANITIZE_STRING);
	 $user_type = filter_var($_POST['user_type'], FILTER_SANITIZE_STRING);
	 $user_email = filter_var($_POST['user_email'], FILTER_SANITIZE_STRING);
	 $phone_number = filter_var($_POST['phone_number'], FILTER_SANITIZE_STRING);
	 $user_gender = filter_var($_POST['user_gender'], FILTER_SANITIZE_STRING);
	 $user_phone = filter_var($_POST['phone_number'], FILTER_SANITIZE_STRING);
	 $user_educationBackground = filter_var($_POST['edu_bg'], FILTER_SANITIZE_STRING);

    /*** now we can encrypt the password ***/
    $user_password = sha1( $user_password );
    
    /*** connect to database ***/
    /*** mysql hostname ***/
    $mysql_hostname = 'localhost';

    /*** mysql username ***/
    $mysql_username = 'seadmin';

    /*** mysql password ***/
    $mysql_password = '19931113';

    /*** database name ***/
    $mysql_dbname = 'seproject';

    try
    {
        $dbh = new PDO("mysql:host=$mysql_hostname;dbname=$mysql_dbname", $mysql_username, $mysql_password);
        /*** $message = a message saying we have connected ***/
		
        /*** set the error mode to excptions ***/
        $dbh->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
		
        /*** prepare the insert ***/
        $stmt = $dbh->prepare("INSERT INTO techer_users (user_name, user_password, user_type , user_gender , user_email , user_phone ,user_educationBackground) VALUES (:user_name, :user_password, :user_type, :user_gender ,:user_email ,:user_phone ,:user_educationBackground )");
		
        /*** bind the parameters ***/
        $stmt->bindParam(':user_name', $user_name, PDO::PARAM_STR);
        $stmt->bindParam(':user_password', $user_password, PDO::PARAM_STR, 40);
		$stmt->bindParam(':user_type', $user_type, PDO::PARAM_STR);
		$stmt->bindParam(':user_gender', $user_gender, PDO::PARAM_STR);
		$stmt->bindParam(':user_email', $user_email, PDO::PARAM_STR);
		$stmt->bindParam(':user_phone', $user_phone, PDO::PARAM_STR);
		$stmt->bindParam(':user_educationBackground', $user_educationBackground, PDO::PARAM_STR);
		$stmt->bindParam(':user_id_card', $user_id_card, PDO::PARAM_STR);
        /*** execute the prepared statement ***/
        $stmt->execute();

        /*** unset the form token session variable ***/
        unset( $_SESSION['form_token'] );
		
  
       

          header("location:reg_succeed.php ");

        /*** if all is done, say thanks ***/
      
		
    }
    catch(Exception $e)
    {
        /*** check if the username already exists ***/
        if( $e->getCode() == 23000)
        {
            $message = 'Username already exists';
        }
        else
        {
            /*** if we are here, something has gone wrong with the database ***/
            $message = 'We are unable to process your request. Please try again later';
        }
    }
}

?>

		
<html>
	<head>
		<title>Register to Techer</title>
		<meta charset="utf-8" />
		<meta name="viewport" content="width=device-width, initial-scale=1" />
		<!--[if lte IE 8]><script src="assets/js/html5shiv.js"></script><![endif]-->
		<link rel="stylesheet" href="assets/css/main.css" />
		<!--[if lte IE 9]><link rel="stylesheet" href="assets/css/ie9.css" /><![endif]-->
		<!--[if lte IE 8]><link rel="stylesheet" href="assets/css/ie8.css" /><![endif]-->
		<noscript><link rel="stylesheet" href="assets/css/noscript.css" /></noscript>

	</head>
	<body class="is-loading">

		<!-- Wrapper -->
			<div id="wrapper">

				<!-- Main -->
					<section id="main">
						<header>
							<span class=""><img src="images/banne.jpg" alt="" /></span>
							<h1>Register to Techer </h1>		
							<form action="#" method="post" enctype="multipart/form-data">
                                <label>UserName :</label>
                                <input id="user_name" name="user_name" placeholder="" type="text">
                                <label>Password :</label>
                                <input id="user_password" name="user_password" placeholder="" type="password">
                                
								<label>Comfirm Password :</label>                                
                                <input id="com_password" name="com_password" placeholder="" type="password">
								<label>User Email :</label>
                                <input id="user_email" name="user_email" type="text">
								<label>Phone Number :</label>
                                <input id="phone_number" name="phone_number" type="text">
								<label>Education Background :</label>
								<select id="edu_bg" name="edu_bg">
									<option value="">Select...</option>
									<option value="degree">Bachelor degree</option>
									<option value="master">Master</option>
									<option value="doctor">Doctor</option>
									<option value="doctor">Others</option>
								</select>
                               
								<label>user type :</label>
								<select id="user_type" name="user_type">
									<option value="">Select...</option>
									<option value="s">Student</option>
									<option value="t">Tutor</option>
								</select>
								<label>user gender :</label>
								<select id="user_gender" name="user_gender">
									<option value="">Select...</option>
									<option value="female">female</option>
									<option value="male">male</option>
								</select>
                                
								</br>
                                
								<img  src="captcha_code_file.php" id = "refresh" title="refreshCode" align="absmiddle" onclick="document.getElementById('refresh').src='captcha_code_file.php' ">							
        						<input id="6_letters_code" name="6_letters_code" type="text">
                                <label>ID CARD :</label>
                                <input type="file" name="user_id_card" id="user_id_card">
                                </br>
                                </br>
                                <input name="submit" type="submit" >
								</br>
								
                                <input type="hidden" name="form_token" value="<?php echo $form_token; ?>" />
								</br>
								
                           
								
								<?php echo $message; ?>
                            </form>
						</header>
						<!--<footer>
							<ul class="icons">
								<li><a href="#" class="fa-twitter">Twitter</a></li>
								<li><a href="#" class="fa-instagram">Instagram</a></li>
								<li><a href="#" class="fa-facebook">Facebook</a></li>
							</ul>
						</footer>-->
					</section>

				<!-- Footer -->
					<footer id="footer">
						<ul class="copyright">
							<li><a href="#">Login</a></li>
						</ul>
					</footer>

			</div>
		<!-- Scripts -->
			<!--[if lte IE 8]><script src="assets/js/respond.min.js"></script><![endif]-->
			<script>
				if ('addEventListener' in window) {
					window.addEventListener('load', function() { document.body.className = document.body.className.replace(/\bis-loading\b/, ''); });
					document.body.className += (navigator.userAgent.match(/(MSIE|rv:11\.0)/) ? ' is-ie' : '');
				}
			</script>
	</body>
</html>