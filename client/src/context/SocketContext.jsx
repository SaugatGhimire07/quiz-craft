import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { io } from "socket.io-client";
import PropTypes from "prop-types";

// Create the context
const SocketContext = createContext(null);

// Custom hook to use the socket context
export const useSocket = () => useContext(SocketContext);

// Provider component
export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    let socketInstance = null;

    const initSocket = () => {
      console.log("Initializing new socket connection");

      // Create socket instance with updated config
      socketInstance = io("http://localhost:5001", {
        withCredentials: true,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        autoConnect: true,
        transports: ["websocket", "polling"],
        forceNew: true, // Force a new connection
      });

      // Connection handlers
      socketInstance.on("connect", () => {
        console.log(`Socket connected with ID: ${socketInstance.id}`);
        setIsConnected(true);
        setSocket(socketInstance);
      });

      socketInstance.on("disconnect", (reason) => {
        console.log(`Socket disconnected: ${reason}`);
        setIsConnected(false);

        // Only attempt reconnection for certain disconnect reasons
        if (reason === "io server disconnect" || reason === "transport close") {
          socketInstance.connect();
        }
      });

      socketInstance.on("connect_error", (error) => {
        console.error("Socket connection error:", error);
        setIsConnected(false);
      });

      return socketInstance;
    };

    // Initialize socket
    socketInstance = initSocket();

    // Cleanup function
    return () => {
      if (socketInstance) {
        console.log("Cleaning up socket connection");
        // Remove all listeners before disconnecting
        socketInstance.removeAllListeners();
        if (socketInstance.connected) {
          socketInstance.disconnect();
        }
        setSocket(null);
        setIsConnected(false);
      }
    };
  }, []); // Empty dependency array

  // Emit events safely
  const emitEvent = useCallback(
    (eventName, data, callback) => {
      if (!socket?.connected) {
        console.warn(`Cannot emit ${eventName}: Socket not connected`);
        return;
      }
      socket.emit(eventName, data, callback);
    },
    [socket]
  );

  return (
    <SocketContext.Provider value={{ socket, isConnected, emitEvent }}>
      {children}
    </SocketContext.Provider>
  );
};

SocketProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export default SocketProvider;
