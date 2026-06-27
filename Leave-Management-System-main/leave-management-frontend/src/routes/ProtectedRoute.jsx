// import LoadingSpinner from "../components/LoadingSpinner";
import { useAuth } from "../context/AuthContext"
import { Navigate } from "react-router-dom";
import LoadingSpinner from "../components/LoadingSpinner";
const ProtectedRoute = ({children, role}) => {

    const {user, isLoading} = useAuth()

    if (isLoading) {
        return (
            <LoadingSpinner/>
        );
    }

    if (!user) {
        return <Navigate to="/login" />;
    }
    if (!role.includes(user.role)) {

        return <Navigate to="/login" />;
    }

    return children;
}
export default ProtectedRoute;