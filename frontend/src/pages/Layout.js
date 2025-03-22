import React from 'react';

const Layout = ({ children }) => {
  return (
    <div style={{
      width: '100vw',
      minHeight: '100vh',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      position: 'relative',
      overflowX: 'hidden'
    }}>
      <div style={{
        position: 'absolute',
        top: 0, left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0,0,0,0.5)'
      }}></div>
      <div style={{ position: 'relative', zIndex: 2 }}>
        {children}
      </div>
    </div>
  );
};

export default Layout;
