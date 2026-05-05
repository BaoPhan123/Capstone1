import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * ProtectedRoute - Requires user to be authenticated
 * If not authenticated, redirects to login page
 */
export const ProtectedRoute = ({ children }) => {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '100vh'
            }}>
                <div className="loading-spinner"></div>
            </div>
        );
    }

    if (!isAuthenticated()) {
        return <Navigate to="/login" replace />;
    }

    return children;
};

/**
 * RoleBasedRoute - Requires user to have specific role(s)
 * If user doesn't have required role, redirects to unauthorized page or home
 * @param {string|string[]} roles - Required role(s)
 * @param {string} redirectTo - Where to redirect if unauthorized (default: '/')
 */
export const RoleBasedRoute = ({ children, roles, redirectTo = '/' }) => {
    const { user, hasRole, isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '100vh'
            }}>
                <div className="loading-spinner"></div>
            </div>
        );
    }

    // Not authenticated - redirect to login
    if (!isAuthenticated()) {
        return <Navigate to="/login" replace />;
    }

    // Check if user has required role(s)
    const requiredRoles = Array.isArray(roles) ? roles : [roles];
    const hasRequiredRole = requiredRoles.some(role => hasRole(role));

    if (!hasRequiredRole) {
        return <Navigate to={redirectTo} replace />;
    }

    return children;
};

/**
 * AdminRoute - Shortcut for admin-only routes
 */
export const AdminRoute = ({ children }) => {
    return (
        <RoleBasedRoute roles="admin" redirectTo="/">
            {children}
        </RoleBasedRoute>
    );
};

/**
 * GuestRoute - Only accessible by non-authenticated users
 * If authenticated, redirects to home or specified path
 */
export const GuestRoute = ({ children, redirectTo = '/' }) => {
    const { isAuthenticated, isAdmin, isLoading } = useAuth();

    if (isLoading) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '100vh'
            }}>
                <div className="loading-spinner"></div>
            </div>
        );
    }

    if (isAuthenticated()) {
        return <Navigate to={isAdmin() ? '/admin' : redirectTo} replace />;
    }

    return children;
};
