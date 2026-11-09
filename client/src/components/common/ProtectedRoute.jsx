import { useSelector } from "react-redux";
import { Navigate, Outlet } from 'react-router-dom';
import {selectUser} from '../../redux/slices/authSlice'

function ProtectedRoute({adminOnly = false}){

    const user = useSelector(selectUser)

    if(!user){
        return <Navigate to="/login" replace/> // replace will create the browser history to make sure user will back forward to the page
    }
    if(adminOnly && user.user?.role !== 'admin'){
        return <Navigate to="/" replace/>
    }
return <Outlet />;
} 
export default ProtectedRoute