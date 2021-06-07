function validate()
{
	var flag=true;
	var str="";
	//checking for name
	if(document.forms[0].elements[0].value.length<1)
	{
		flag=false;
		str=str+"\n Name cannot be blank";
		alert(str);
		document.getElementById("n").style.color="red";
		document.forms[0].elements[0].focus();
		return;
	}
	
	//checking for password
	if(document.getElementById("pwd").value.length<1)
	{
		flag=false;
		str=str+"\n Password cannot be blank";
	}
	
	//checking for gender
	var x=document.forms[0].gender[0].checked; // will save true if checked
	var y=document.forms[0].gender[1].checked;
	if(x==false && y==false)
	{	
		flag = false;
		str = str + "\n Please enter a gender";
	}
	
	//checking for hobbies
	var a=document.forms[0].hobbies[0].checked;
	var b=document.forms[0].hobbies[1].checked;
	var c=document.forms[0].hobbies[2].checked;
	if(a==false && b==false && c==false)
	{
		flag = false;
		str=str + "\n Please enter a hobby";
	}

	//checking for city
	var city=document.f1.c1.value;
	if( city=="")	//"" is the value of "select city" option.
	{
		flag= false;
		str=str + "\n Please enter a city";
	} 

	
	if(flag==false)
	{
		alert(str);
	}
	else
	{
		document.forms[0].submit();
	}
}