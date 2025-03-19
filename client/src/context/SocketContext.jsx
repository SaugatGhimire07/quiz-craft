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

  // Initialize socket connection
  useEffect(() => {
    console.log("Initializing socket connection");

    // Create socket instance with more explicit options
    const socketInstance = io("http://localhost:5001", {
      withCredentials: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      autoConnect: true,
      transports: ["websocket"], // Try websocket first
      timeout: 10000, // Increase timeout
    });

    // Add connection event handlers with more detailed logging
    const onConnect = () => {
      console.log("Socket connected successfully with ID:", socketInstance.id);
      setIsConnected(true);
    };

    const onDisconnect = (reason) => {
      console.log("Socket disconnected, reason:", reason);
      setIsConnected(false);
    };

    const onConnectError = (error) => {
      console.error("Socket connection error:", error);
      // Try to reconnect with polling if websocket fails
      if (socketInstance.io.opts.transports[0] === "websocket") {
        console.log("Retrying with polling transport");
        socketInstance.io.opts.transports = ["polling", "websocket"];
      }
    };

    socketInstance.on("connect", onConnect);
    socketInstance.on("disconnect", onDisconnect);
    socketInstance.on("connect_error", onConnectError);

    setSocket(socketInstance);

    return () => {
      if (socketInstance) {
        console.log("Cleaning up socket connection");
        socketInstance.off("connect", onConnect);
        socketInstance.off("disconnect", onDisconnect);
        socketInstance.off("connect_error", onConnectError);
        socketInstance.disconnect();
      }
    };
  }, []);

  // Function to emit socket events with error handling
  const emitEvent = useCallback(
    (eventName, data, callback) => {
      if (!socket || !isConnected) {
        console.error(`Cannot emit ${eventName} - socket not connected`);
        return false;
      }

      console.log(`Emitting ${eventName}:`, data);

      try {
        socket.emit(eventName, data, callback);
        return true;
      } catch (error) {
        console.error(`Error emitting ${eventName}:`, error);
        return false;
      }
    },
    [socket, isConnected]
  );

  const contextValue = {
    socket,
    isConnected,
    emitEvent,
  };

  return (
    <SocketContext.Provider value={contextValue}>
      {children}
    </SocketContext.Provider>
  );
};

SocketProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

// Export default provider component
export default SocketProvider;
